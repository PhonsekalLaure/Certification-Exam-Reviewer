"""Import supplied visual reviewers. Offline authoring tool; not an application dependency.

Requires Python with pypdf/Pillow, Poppler's pdftoppm, and English Windows OCR.
Original documents are read-only; archival output goes only to tmp/reviewer-import. Active text banks are untouched.
"""
import argparse, json, logging, re, shutil, subprocess
from pathlib import Path
from PIL import Image, ImageChops, ImageOps, ImageDraw
from pypdf import PdfReader
from reviewer_content import HTML, JS, HTML_CHAPTERS, JS_CHAPTERS

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--documents',type=Path,default=Path(__file__).resolve().parents[2]/'Certification Exam Reviewer Documents')
parser.add_argument('--pdftoppm',default=shutil.which('pdftoppm'))
args=parser.parse_args()
if not args.pdftoppm:parser.error('Install Poppler or supply --pdftoppm PATH.')
STAGE=Path(__file__).resolve().parents[1]
ROOT=STAGE/'tmp/reviewer-import'
ROOT.mkdir(parents=True,exist_ok=True)
(ROOT/'visual-banks').mkdir(parents=True,exist_ok=True)
DOCS=args.documents.resolve()
for name,slug in [('HTML and CSS 1.pdf','html1'),('JavaScript.pdf','javascript')]:
    out=ROOT/'pages'/slug
    out.mkdir(parents=True,exist_ok=True)
    subprocess.run([args.pdftoppm,'-scale-to','1800','-png',str(DOCS/name),str(out/'page')],check=True)
    subprocess.run(['powershell.exe','-NoProfile','-File',str(STAGE/'scripts/ocr_pdf_pages.ps1'),'-ImageDirectory',str(out),'-OutputPath',str(ROOT/f'{slug}-ocr.json')],check=True)

def pages(slug):
    result=json.loads((ROOT/f'{slug}-ocr.json').read_text(encoding='utf-8-sig'))
    return sorted(result,key=lambda p:int(re.search(r'(\d+)\.png',p['file'])[1]))
def markers(slug):
    output={}
    for page_index,page in enumerate(pages(slug),1):
        for line in sorted(page['lines'],key=lambda l:l['y']):
            found=re.match(r'^QUESTION\s+(\d+)\b',line['text'],re.I)
            if found:
                output[int(found[1])]={'page':page_index,'y':line['y']}
    return output

def crop_part(slug,number,kind,page,top,bottom,index):
    if bottom-top<25: return None
    src=Image.open(ROOT/'pages'/slug/page['file']).convert('RGB')
    piece=src.crop((0,max(0,int(top)),src.width,min(src.height,int(bottom))))
    box=ImageChops.difference(piece,Image.new('RGB',piece.size,'white')).convert('L').point(lambda x:255 if x>40 else 0).getbbox()
    if not box or box[3]-box[1]<12: return None
    piece=ImageOps.expand(piece.crop(box),border=12,fill='white')
    out=ROOT/'source-exhibits'/slug
    out.mkdir(parents=True,exist_ok=True)
    filename=f'q{number:03}-{kind}-{index}.webp'
    piece.save(out/filename,'WEBP',quality=88,method=6)
    return {'src':f'/reviewers/{slug}/{filename}','width':piece.width,'height':piece.height,'alt':f'{slug} source question {number}, {"question" if kind=="front" else "answer"} exhibit {index}'}

def extract(slug):
    source_pages=pages(slug)
    starts=markers(slug)
    total=24 if slug=='html1' else 21
    assert sorted(starts)==list(range(1,total+1)), (slug,starts)
    output=[]
    for number in range(1,total+1):
        start=starts[number]
        stop=starts.get(number+1,{'page':len(source_pages),'y':source_pages[-1]['height']*.9})
        answer=None
        for pi in range(start['page'],stop['page']+1):
            for line in sorted(source_pages[pi-1]['lines'],key=lambda l:l['y']):
                if pi==start['page'] and line['y']<start['y']:continue
                if pi==stop['page'] and line['y']>=stop['y']:continue
                if re.match(r'^Correct\s*Answer\s*:',line['text'],re.I):
                    answer={'page':pi,'y':line['y'],'bottom':line['bottom'],'label':line['text']}
                    break
            if answer:break
        assert answer,(slug,number)
        images={'front':[],'back':[]}
        text=[]
        for kind,begin,end in [('front',start,answer),('back',{'page':answer['page'],'y':answer['y']},stop)]:
            for pi in range(begin['page'],end['page']+1):
                page=source_pages[pi-1]
                top=max(page['height']*.105,begin['y']-7) if pi==begin['page'] else page['height']*.105
                bottom=min(page['height']*.921,end['y']-12) if pi==end['page'] else page['height']*.921
                # Keep a textual inline answer key in the answer crop.
                if kind=='back' and pi==answer['page']:top=max(page['height']*.105,answer['y']-7)
                cuts=[]
                brand=[line for line in page['lines'] if top<=line['y']<=bottom and re.search(r'GRATIS|Free Pract.ke Exams',line['text'],re.I)]
                if brand:
                    btop=min(line['y'] for line in brand)-35
                    urls=[line for line in page['lines'] if btop<line['y']<btop+220 and re.search('gratisexam',line['text'],re.I)]
                    bend=max([line['bottom'] for line in brand]+[line['bottom'] for line in urls])+17
                    cuts.append((btop,bend))
                segments=[]
                cursor=top
                for a,b in cuts:
                    if a>cursor:segments.append((cursor,a))
                    cursor=max(cursor,b)
                if cursor<bottom:segments.append((cursor,bottom))
                for a,b in segments:
                    image=crop_part(slug,number,kind,page,a,b,len(images[kind])+1)
                    if image:images[kind].append(image)
                if kind=='front':
                    text.extend(line['text'] for line in sorted(page['lines'],key=lambda l:(round(l['y']/7),l['x'])) if top<=line['y']<=bottom and not re.search(r'gratis|Free Pract|^EXAM$|^GRATIS$|https?://',line['text'],re.I))
        assert images['front'] and images['back'],(slug,number,images)
        output.append({'number':number,'start':start,'answer':answer,'stop':stop,'images':images,'ocrText':'\n'.join(text)})
    (ROOT/f'{slug}-segments.json').write_text(json.dumps(output,indent=2),encoding='utf-8')
    # Small contact sheets for reviewing the answer keys; source files remain unchanged.
    for offset in range(0,total,6):
        sheet=Image.new('RGB',(1800,1800),'#eeeee8')
        draw=ImageDraw.Draw(sheet)
        for index,q in enumerate(output[offset:offset+6]):
            x=(index%3)*600;y=(index//3)*900
            draw.text((x+12,y+8),f'{slug.upper()} QUESTION {q["number"]}',fill='black')
            thumbs=[]
            for part in q['images']['back']:
                image=Image.open(ROOT/'source-exhibits'/Path(part['src']).parts[-2]/Path(part['src']).name)
                image.thumbnail((580,820))
                thumbs.append(image.copy())
            # Stack source parts then shrink as a unit to fit.
            tall=Image.new('RGB',(max(i.width for i in thumbs),sum(i.height for i in thumbs)),'white')
            yy=0
            for image in thumbs:tall.paste(image,(0,yy));yy+=image.height
            tall.thumbnail((580,850))
            sheet.paste(tall,(x+10,y+35))
        sheet.save(ROOT/f'{slug}-answers-{offset+1}.jpg',quality=92)
    print(slug,total,'questions',sum(len(q['images']['front'])+len(q['images']['back']) for q in output),'image segments')

extract('html1')
extract('javascript')

def alternate_pages():
    result={}
    logging.getLogger('pypdf').setLevel(logging.ERROR)
    doc=PdfReader(DOCS/'HTML and CSS 2.pdf')
    for i,page in enumerate(doc.pages,1):
        for m in re.finditer(r'QUESTION\s+(\d+)\b',page.extract_text(),re.I):result[int(m[1])]=i
    assert len(result)==24
    return result

def build(slug,cert_id,entries,chapters,source_files):
    segments=json.loads((ROOT/f'{slug}-segments.json').read_text())
    alt=alternate_pages() if slug=='html1' else {}
    data=[]
    for segment in segments:
        n=segment['number']
        chapter,prompt,kind,key,explanation=entries[n]
        status='invalid' if kind=='reference' else 'qualified' if 'Source-key caveat:' in explanation else 'standard'
        q={'id':f'{cert_id}-q{n:03}','number':n,'chapterId':chapter,'sourcePage':segment['start']['page'],
           'sourceFile':source_files[0],'sourceReferences':[{'file':source_files[0],'page':segment['start']['page']}],
           'prompt':prompt,'exhibit':'','options':[],'correctIds':[],'pairs':[],
           'explanation':explanation,'status':status,'scorable':status=='standard',
           'questionImages':[i for i in segment['images']['front'] if i['height']>=70] or segment['images']['front'],'answerImages':[i for i in segment['images']['back'] if i['height']>=70] or segment['images']['back'],
           'sourceTranscript':segment['ocrText']}
        if alt:q['sourceReferences'].append({'file':source_files[1],'page':alt[n]})
        for side in ['questionImages','answerImages']:
            for i,image in enumerate(q[side],1):image['alt']=f'{prompt} Original {"question" if side=="questionImages" else "answer-key"} exhibit, part {i}.'
        if kind=='choice':
            q.update(type='single',correctIds=[key],answerLabel=key.upper(),options=[{'id':letter,'text':f'Option {letter.upper()} in the source exhibit'} for letter in 'abcd'])
        elif kind=='order':
            q.update(type='ordering',answerLabel='Put the source items in the sequence below.',options=[{'id':f'item-{i}','text':text} for i,text in enumerate(key,1)],correctIds=[f'item-{i}' for i in range(1,len(key)+1)])
        elif kind=='reference':
            q.update(type='reference',answerLabel='Source diagram for study',studyNote='The source answer diagram is incomplete or inconsistent. This exercise is available as a flashcard and is excluded from quizzes.')
        else:
            q.update(type='matching',answerLabel='See the source selections and matches below.')
            pairs=key if kind=='pairs' else [(f'Statement {i}' if kind in ('yn','tf') else f'Blank {i} (top to bottom)',text) for i,text in enumerate(key,1)]
            q['pairs']=[{'id':f'pair-{i}','left':left,'right':right} for i,(left,right) in enumerate(pairs,1)]
            q['matchOptions']=['Yes','No'] if kind=='yn' else ['True','False'] if kind=='tf' else list(dict.fromkeys(right for _,right in pairs))
        if status=='qualified':q['studyNote']='The PDF’s marked key has a known caveat. Read the study explanation before treating it as a correct implementation. Standard quizzes exclude this item.'
        data.append(q)
    chapter_data=[]
    for i,(title,description,ids) in enumerate(chapters,1):
        assert sorted(q['number'] for q in data if q['chapterId']==i)==sorted(ids)
        chapter_data.append({'id':i,'title':title,'description':description,'slug':f'{cert_id}-{i}','count':len(ids)})
    result={'source':source_files[0],'sourceFiles':source_files,'edition':'Supplied certification reviewer','chapters':chapter_data,'questions':data}
    (ROOT/f'visual-banks/{cert_id}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(cert_id,len(data),'questions',sum(q['scorable'] for q in data),'standard quiz items')

build('html1','html-css',HTML,HTML_CHAPTERS,['HTML and CSS 1.pdf','HTML and CSS 2.pdf'])
build('javascript','javascript',JS,JS_CHAPTERS,['JavaScript.pdf'])

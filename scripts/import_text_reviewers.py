"""Rebuild native text exercises from reviewed transcriptions; no OCR dependency."""
import json
from pathlib import Path
from text_reviewer_content import HTML_TEXT, JS_TEXT

ROOT = Path(__file__).resolve().parents[1]

def convert(bank, entries):
    assert len(entries) == len(bank['questions'])
    for q in bank['questions']:
        data=entries[q['number']]
        q['prompt']=data['prompt']
        q['exhibit']=data['exhibit']
        for key in ['questionImages','answerImages','sourceTranscript']:
            q.pop(key,None)
        q['contentFormat']='text'
        if data['labels'] is not None:
            assert len(data['labels'])==len(q['pairs']),(q['id'],data['labels'])
            for pair,label in zip(q['pairs'],data['labels']):pair['left']=label
        choices=data['choices']
        if choices:
            row_choices=choices if isinstance(choices[0],list) else [choices]*len(q['pairs'])
            assert len(row_choices)==len(q['pairs']),q['id']
            for pair,options in zip(q['pairs'],row_choices):
                assert pair['right'] in options,(q['id'],pair['right'],options)
                pair['options']=options
            q['matchOptions']=list(dict.fromkeys(option for options in row_choices for option in options))
        if data['options'] is not None:
            assert len(data['options'])==len(q['options'])
            for option,text in zip(q['options'],data['options']):option['text']=text
        for index,text in enumerate(data.get('orderingDistractors',[]),1):
            if not any(o['text']==text for o in q['options']):q['options'].append({'id':f'extra-{index}','text':text})
        if q['type']=='ordering':q['options'].sort(key=lambda option:option['text'])
        q['answerExhibit']=data.get('answerExhibit','')
        if data.get('explanation'):q['explanation']=data['explanation']
        if data.get('caveat'):
            q['status']='qualified'
            q['studyNote']='The source answer needs context. Read the explanation; standard quizzes exclude this item.'
            q['explanation']=data['caveat']
        if q['number']==24 and q['id'].startswith('html-css'):
            q['explanation']=data['explanation']
        # Retain the original marked keys and grading eligibility unless a newly
        # verified transcription caveat requires excluding an item.
        q['scorable']=q['status']=='standard'
        assert not any('in the source exhibit' in o['text'] for o in q['options']),q['id']
        assert all(not p['left'].startswith(('Statement ','Blank ')) for p in q['pairs']),q['id']
    return bank

def main():
    for name,entries in [('html-css',HTML_TEXT),('javascript',JS_TEXT)]:
        path=ROOT/f'src/data/{name}.json'
        bank=convert(json.loads(path.read_text(encoding='utf-8')),entries)
        path.write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(name,len(bank['questions']),'text exercises;',sum(q['scorable'] for q in bank['questions']),'standard quiz items')

if __name__=='__main__':main()

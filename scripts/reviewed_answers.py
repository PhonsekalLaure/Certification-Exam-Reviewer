"""Explicit answer-key audit and repaired practice exercises (2026-11-26).

Applied after source transcription. Source keys are kept in source_reviewer_keys.json;
adaptations never claim to reconstruct missing PDF wording.
"""
from copy import deepcopy
MDN='https://developer.mozilla.org/en-US/docs/'
REFS={
 'cascade':('CSS cascade and specificity','Web/CSS/Guides/Cascade/Specificity'),
 'url':('Resolving relative references','Web/API/URL_API/Resolving_relative_references'),
 'html':('HTML head element','Web/HTML/Reference/Elements/head'),
 'img':('Image text alternatives','Web/HTML/Reference/Elements/img'),
 'units':('CSS length units','Web/CSS/Reference/Values/length'),
 'media':('Media-query width','Web/CSS/Reference/At-rules/@media/width'),
 'float':('CSS clear','Web/CSS/Reference/Properties/clear'),
 'color':('CSS hexadecimal colors','Web/CSS/Reference/Values/hex-color'),
 'background':('CSS background','Web/CSS/Reference/Properties/background'),
 'position':('CSS positioning','Web/CSS/Reference/Properties/position'),
 'video':('HTML video element','Web/HTML/Reference/Elements/video'),
 'js':('JavaScript guide','Web/JavaScript/Guide'),
 'typeof':('JavaScript typeof','Web/JavaScript/Reference/Operators/typeof'),
 'date':('Date constructor','Web/JavaScript/Reference/Global_Objects/Date/Date'),
 'loop':('Loops and iteration','Web/JavaScript/Guide/Loops_and_iteration'),
 'prompt':('Window.prompt','Web/API/Window/prompt'),
 'text':('String.toLowerCase','Web/JavaScript/Reference/Global_Objects/String/toLowerCase'),
}
HTML_WHY={
1:'With no base element, a path-relative URL is resolved against the current document URL and keeps its server. images/logo.png cannot name another server. A network-path reference beginning //host is a different form and is outside this explicitly scoped question.',
2:'img embeds the image, src identifies its resource, and alt supplies the text alternative. alt is useful when the image cannot be rendered and for assistive technology; a particular pre-download visual display is not guaranteed.',
3:'Use a:link for unvisited links, a:visited for visited links, a:hover for pointer hover, and a:active for activation. Keeping these equal-specificity rules in link, visited, hover, active order lets the interactive states override earlier colors.',
4:'No author CSS is supplied, so the browser uses its default stylesheet. User styles and browser preferences can also affect rendering.',
5:'The inline paragraph color is blue. The later internal h1 rule makes Awards maroon and the h2 rule makes Rock Climbing 101 blue. The unstyled paragraph uses black from the internal rule, which follows the external rule of equal specificity.',
6:'Green is correct. The .light p selector directly sets the paragraph background and is more specific than p. Pink belongs to the enclosing div; background-color is not inherited. This corrects the PDF key, Pink.',
7:'The universal selector * matches every element. The other choices are combinators or an incomplete pseudo-class prefix.',
8:'h1 selects all h1 elements; text-align: center centers their inline content.',
9:'CSS comments use /* ... */. em does not always refer to the root font size; rem does. Percentage references depend on the property and context, so width: 50% is not always half the viewport. A font-family fallback list helps when the preferred font is unavailable. These statements replace ambiguous source generalizations.',
10:'Line 02 matches #style1, giving red text at 30px. Line 03 has no overriding color rule and inherits purple from body. The source final selection, red, is corrected to purple.',
11:'The doctype precedes html. The title belongs inside head; the visible greeting belongs inside body. Close each element in nesting order.',
12:'The declaration is <!DOCTYPE html>, so the first blank inside angle brackets is !DOCTYPE html. html encloses head and body; Hello World belongs in body. The PDF misplaced the exclamation mark. A fixed head and title have been added to make the exercise complete.',
13:'A head section can contain charset metadata and a title. This exercise explicitly requires charset before title, giving a unique order. The doctype belongs before html, header belongs in body, and </head> closes head. The malformed source diagram has been replaced with an adapted, complete exercise.',
14:'link with rel="stylesheet" loads the CSS file; script with src loads JavaScript; title names the browser tab; noscript supplies fallback content when scripting is disabled. meta cannot link a stylesheet. Missing source choices and targets have been replaced with a complete adapted exercise.',
15:'Use SmallLogo.png as the default, then min-width: 768px to switch to NormalLogo.png at 768px and above. A max-width query would reverse the requirement, including its boundary. The key now covers 767px, 768px, and wider viewports.',
16:'Both spans explicitly use display: inline. A following paragraph can wrap beside a floated image and is not forced entirely below it. clear: both on the final paragraph moves it below preceding floats. Valid markup and explicit layout rules replace the source’s malformed, underspecified exhibit.',
17:'The corrected .productBox selector matches the displayed div. #000000 is black and #00FF00 is green. The source’s .product versus productBox mismatch has been repaired; answer C remains correct.',
18:'Use color, line-height, font-size, and font-style. #0000ff is valid blue; the source’s five-digit #000ff was invalid. The font size 1.5em is relative to the inherited font size, whereas line-height is explicitly 50px.',
19:'#0000FF is blue, not red. repeat-x requests horizontal repetition and right positions the background image at the right edge. The second statement is now precise and true, correcting the source’s second No.',
20:'Absolute positioning removes the element from normal flow. In this stated setup, offsets are measured from its nearest positioned ancestor’s containing block. Relative positioning instead offsets an element from its normal position and preserves its flow space. The source’s vague wording and Relative key have been corrected.',
21:'color sets blue, font-family selects Arial, font-size sets 20px, font-weight makes the text bold, and text-align centers inline content.',
22:'Use img with src="contoso.png" and alt="Contoso Logo". alt is the image’s text alternative; title is advisory information and is not a substitute.',
23:'video controls provides the playback controls. A nested source points to HowTo.mp4 with MIME type video/mp4. The closing tag is video. Fallback child text is for browsers without video-element support; it is not a general codec-error message.',
24:'Use img, src, and alt. HTML Icon is the text alternative explicitly required in the source prompt; the clipped attribute value is completed from that requirement. How and when alternative text appears visually depends on the browser.',
}
JS_WHY={
1:'Read the input’s value and the paragraph’s innerHTML, then call toLowerCase() on both strings. The paragraph is explicitly plain text here. This corrects the source’s invalid value/innerHTML selections in the normalization blanks. For arbitrary text content, textContent is preferable to serializing markup.',
2:'Reassigning the student parameter does not change sampleStudent. Mutating the object through course changes sampleCourse.name and grade. The final values are HTML Student, JavaScript, and 100.',
3:'shift removes 20, pop removes 80, push adds 10 at the end, and unshift adds 100 at the front. The final array is [100, 40, 60, 10].',
4:'The outputs are undefined, string, object, number, object. Arrays are objects: typeof does not return array. typeof null also returns object, a longstanding JavaScript behavior. Use Array.isArray when you need an array-specific test.',
5:'toFixed(digits) returns a string formatted with the specified number of decimal places for the stated range. toPrecision counts significant digits and toString interprets its argument as a radix. Binary floating-point representation can affect rounding.',
6:'The outer multiply reads 25 and 4, returning 100. When getProduct is invoked, its nested multiply reads the local 2 and 3, returning 6. Merely declaring getProduct does not execute its body.',
7:'Both new Date() and new Date create a current Date when no arguments are passed, so both first-row choices are accepted. Date() without new returns a string. getMonth() reads the zero-based local month and setMonth(month + value) adjusts it. End-of-month overflow follows Date rules rather than clamping to the last day.',
8:'Initialize numbers with [], append with push, advance j using j+2, and add numbers[j]. j = j++ restores the old value and can prevent termination. array[j] refers to a different, undeclared name. The corrected loop sums indices 0, 2, 4, 6, and 8.',
9:'The quoted destination is a String, 2489.58 is a Number, and true is a Boolean. These answer labels name the types; typeof would return lowercase strings.',
10:'Math.ceil rounds upward to 101, Math.floor rounds downward to 100, and Math.round(100.5) returns 101.',
11:'Numeric Date months are zero-based: January is 0. Use 2017 for the year and 1 for the day. The clipped day argument has been supplied from the prompt’s explicit January 1 requirement.',
12:'&& requires both warm weather and no rain. Only when that condition fails does the <= .5 fuel check choose the train; more fuel selects driving.',
13:'age < 5 || age >= 65 covers both free groups. age >= 5 && age < 18 covers ages 5 through 17. The remaining ages keep the default price of 20.',
14:'switch (day) selects a branch; case "Wednesday": assigns 0.1 and break exits the switch. default: returns a zero discount for other strings.',
15:'for traverses the supplied list, continue skips a null entry, and break stops at orange. The array is now an explicit function parameter and the clipped loop header is completed with a local index and i++; these are labeled adaptations, not recovered source text.',
16:'Initialize i to start, test i >= 0, and decrement with --i. The source’s i > 0 omitted zero. The stated nonnegative integer input makes the endpoint behavior well defined.',
17:'Use switch (month) and break after both completed cases. continue cannot end a switch case when no enclosing loop exists. The adapted function completes the clipped source with a 31-day default and a return; month indices are 0–11 and leap years are explicitly ignored.',
18:'Both statements are No. denominator = 0 assigns a falsy value, so the shown function always takes else and returns true. For the stated numeric inputs, denominator === 0 would implement the intended check; != would invert the intended test.',
19:'With x = 5 and y = 7, both comparisons joined by && are true; neither equality joined by || is true; x !== 7 is true; and negating x == y gives true.',
20:'prompt requests text (or returns null on cancel), alert displays an informational message, and confirm requests an OK/Cancel decision returning a Boolean. The PDF’s clipped scenarios have been replaced with these explicitly authored scenarios.',
21:'try protects the invocation and catch handles its thrown exception. The requested message is shown for any caught exception; it does not prove that a missing function was the cause. eval remains only as literal study code and is never run by the reviewer UI.',
}

def apply_review(bank, name, source_keys):
    for q in bank['questions']:
        n=q['number']; html=name=='html-css'
        original=source_keys[str(n)]
        def rights(values):
            assert len(values)==len(q['pairs'])
            for p,v in zip(q['pairs'],values): p['right']=v
        def labels(values):
            for p,v in zip(q['pairs'],values):p['left']=v
        kind='verified'; note='Answer and explanation reviewed against the displayed exercise.'; ref='cascade' if html else 'js'
        if html:
            if n==1:
                kind='adapted';ref='url'
                q['prompt']='A page is at https://www.contoso.com/courses/index.html and has no base element. For each statement about path-relative and absolute URLs, select Yes or No. Here, path-relative excludes network-path references beginning with //.'
                labels(['A path-relative link must include a protocol and server name.','lessons/intro.html can reference a document in a subdirectory of the current page’s directory.','images/logo.png can reference an image on a different server without changing the document base URL.','https://www.contoso.com/products.html is an absolute URL.']);rights(['No','Yes','No','Yes'])
            elif n in (2,22,24):
                ref='img';kind='adapted'
                files={2:('portrait.png','Family Portrait'),22:('contoso.png','Contoso Logo'),24:('html15.gif','HTML Icon')};file,alt=files[n]
                q['prompt']=f'Display the image {file} with the text alternative {alt} for assistive technology or when the image is unavailable. Complete the element and attributes. Choices may be reused or omitted.'
            elif n==3:q['prompt']='Complete the link pseudo-class rules: unvisited links red, visited links blue, links under the pointer orange, and links during activation green. Each selector may be used once, more than once, or not at all.'
            elif n==6:kind='corrected';q['correctIds']=['d']
            elif n==9:
                kind='adapted';ref='units'
                labels(['A CSS comment starts with /* and ends with */.','The em unit always refers to the root element’s font size.','width: 50% always means half the viewport width.','A font-family fallback list can help when the preferred font is unavailable.']);rights(['Yes','No','No','Yes'])
            elif n==10:kind='corrected';rights(['red','30 pixels','purple'])
            elif n==12:
                kind='corrected';ref='html';rights(['!DOCTYPE html','html','body','body','html'])
                for p in q['pairs']:p['options']=[x.replace('DOCTYPE html!','!DOCTYPE html') for x in p['options']]
                q['exhibit']='<[1]>\n<[2]>\n  <head>\n    <meta charset="utf-8">\n    <title>Hello World</title>\n  </head>\n  <[3]>\n    Hello World\n  </[4]>\n</[5]>'
            elif n==13:
                kind='adapted';ref='html'
                q.update(type='ordering',prompt='Build a head section for the About Contoso page. Select four segments in order, placing the charset declaration before the title. Omit segments that do not belong inside this head section.',exhibit='',pairs=[],options=[{'id':f'head-{i}','text':v} for i,v in enumerate(['<head>','<meta charset="utf-8">','<title>About Contoso</title>','</head>','<!DOCTYPE html>','<header>New Releases</header>','<head/>'])],correctIds=['head-0','head-1','head-2','head-3'])
            elif n==14:
                kind='adapted';ref='html'
                q.update(type='matching',prompt='Complete this Blue Yonder Airlines page: load style.css as a stylesheet, load _js/form.js as an external script, set the page title, and show the specified fallback when scripting is disabled. Select the element name for each blank.',exhibit='<head>\n  <[1] rel="stylesheet" href="style.css">\n  <[2] src="_js/form.js"></[2]>\n  <[3]>Blue Yonder Airlines</[3]>\n</head>\n<body>\n  <[4]>Your browser does not support JavaScript!</[4]>\n</body>',options=[],correctIds=[],pairs=[{'id':f'pair-{i}','left':f'[{i}] {label}','right':right,'options':['link','script','title','noscript','meta','base']} for i,(label,right) in enumerate([('Stylesheet element','link'),('External-script element','script'),('Tab-title element','title'),('Scripting-fallback element','noscript')],1)])
            elif n==15:kind='corrected';ref='media';rights(['SmallLogo.png','min-width','NormalLogo.png']);q['prompt']='For viewport widths below 768 CSS pixels, use SmallLogo.png as the welcome background. At 768 CSS pixels and above, use NormalLogo.png. Complete the CSS.'
            elif n==16:
                kind='adapted';ref='float'
                q['prompt']='For this explicitly sized layout, select Yes or No for each statement. No additional styles apply. The image floats left; consider how ordinary text and cleared text relate to it.'
                q['exhibit']='<style>\n  .container { width: 600px; font: 16px/24px Arial; }\n  .label, .question { display: inline; }\n  .icon { float: left; width: 100px; height: 200px; }\n  .after { clear: both; }\n</style>\n<div class="container">\n  <span class="label">Welcome!</span>\n  <span class="question">What is the Internet?</span>\n  <img class="icon" src="icon.jpg" alt="TCP/IP icon">\n  <p class="description">The Internet is a network of networks.</p>\n  <p class="after">The Web is an information space.</p>\n</div>'
                labels(['Both spans use inline display.','The description paragraph must be placed entirely below the floated image.','The paragraph with class after clears the float and starts below the image.']);rights(['Yes','No','Yes'])
            elif n==17:
                kind='corrected';ref='color';q['exhibit']=q['exhibit'].replace('.product {','.productBox {')+'\n\n<div class="productBox">Product information</div>'
                q['prompt']='The .productBox rule below applies to the displayed div. A designer claims it displays white text on a green background. Choose No change is needed if that claim is correct; otherwise, select its replacement description.'
            elif n==18:kind='corrected';ref='color';q['exhibit']=q['exhibit'].replace('#000ff;','#0000ff;');q['prompt']=q['prompt'].replace('source rule','rule')
            elif n==19:kind='corrected';ref='background';labels(['The background color is red.','The image uses horizontal repetition and is positioned at the right edge.']);rights(['No','Yes'])
            elif n==20:
                kind='adapted';ref='position';q['correctIds']=['b'];q['prompt']='Evaluate the term Static positioning in this statement: “Static positioning removes an element from normal flow and uses top/right/bottom/left offsets relative to its nearest positioned ancestor’s containing block.” Assume such an ancestor exists and no transform establishes another containing block. Choose the replacement term, or No change is needed.'
            elif n==23:ref='video'
            q['explanation']=HTML_WHY[n]
        else:
            if n==1:kind='corrected';ref='text';rights(['value','innerHTML','toLowerCase()','toLowerCase()']);q['prompt']+=' Assume userText is a paragraph containing plain text only, without child elements or encoded markup.'
            elif n==4:kind='corrected';ref='typeof';rights(['undefined','string','object','number','object'])
            elif n==5:q['prompt']='For a finite Number value with absolute value below 10^21 and an integer digits from 3 through 100, choose the function that returns a string formatted with exactly digits decimal places.'
            elif n==6:q['pairs'][1]['left']='When getProduct() is invoked, its call to multiply on line 19 returns 100.'
            elif n==7:
                kind='corrected';ref='date';q['pairs'][0]['acceptedAnswers']=['var date = new Date();','var date = new Date;'];q['prompt']+=' More than one first-row construction is valid; either is accepted. value is an integer and standard Date overflow behavior is intended.'
            elif n==8:kind='corrected';ref='loop';rights(['[]','push','j+2','numbers[j]'])
            elif n==11:kind='adapted';ref='date';q['prompt']='Initialize a Date for January 1, 2017 using numeric year, month, and day arguments. Select the year and month. The day argument is fixed to 1.'
            elif n==15:
                kind='adapted';ref='loop';q['prompt']='Complete doWork(list) to traverse a supplied array, skip null elements, and stop when the string orange is found. Choose the loop keyword, the keyword that skips the current iteration, and the keyword that exits the loop.'
                q['exhibit']='function doWork(list) {\n  [1] (var i = 0; i < list.length; i++) {\n    if (list[i] === null)\n      [2];\n    if (list[i] === "orange") {\n      alert("found");\n      [3];\n    }\n    console.log(list[i]);\n  }\n}'
            elif n==16:kind='corrected';ref='loop';rights(['var i = start;','i >= 0;','--i']);q['prompt']+=' Assume start is a nonnegative integer.'
            elif n==17:
                kind='adapted';ref='loop';rights(['switch (month) {','break;','break;']);q['prompt']='Complete getDaysInMonth(month) for an integer month index from 0 (January) to 11 (December). Ignore leap years: February has 28 days. Choose the switch header and the two case-ending statements.'
                q['exhibit']='function getDaysInMonth(month) {\n  var daysInMonth;\n  [1]\n    case 1:\n      daysInMonth = 28;\n      [2]\n    case 3:\n    case 5:\n    case 8:\n    case 10:\n      daysInMonth = 30;\n      [3]\n    default:\n      daysInMonth = 31;\n  }\n  return daysInMonth;\n}'
            elif n==18:q['prompt']+=' Assume both parameters are finite numbers.'
            elif n==20:
                kind='adapted';ref='prompt';q.update(type='matching',prompt='Choose the browser popup function for each scenario: collect a text response, show a message, or request an OK/Cancel decision. Each function may be used once, more than once, or not at all.',exhibit='',options=[],correctIds=[],pairs=[{'id':f'pair-{i}','left':label,'right':right,'options':['alert','confirm','prompt']} for i,(label,right) in enumerate([('Ask the user to enter their name as text.','prompt'),('Show an informational message without requesting input or a decision.','alert'),('Ask the user to accept with OK or decline with Cancel.','confirm')],1)])
            q['explanation']=JS_WHY[n]
        if kind=='adapted':note='Adapted from the source: ambiguous or clipped wording/markup has been completed for a self-contained practice question.'
        elif kind=='corrected':note='Corrected source key or code. The explanation identifies the repair.'
        title,url=REFS[ref]
        q['review']={'kind':kind,'reviewedAt':'2026-11-26','summary':note,'references':[{'label':title,'url':MDN+url}]}
        if kind!='verified':q['review']['originalAnswer']={k:deepcopy(original.get(k,[])) for k in ['type','answerLabel','correctIds','pairs','options']}
        q.update(status='standard',scorable=True,answerExhibit='')
        q.pop('studyNote',None)
        if q['type']=='matching':
            q['answerLabel']=' / '.join(p['right'] for p in q['pairs'])
            q['matchOptions']=list(dict.fromkeys(v for p in q['pairs'] for v in p['options']))
            for p in q['pairs']:
                assert p['right'] in p['options'],q['id']
                assert all(v in p['options'] for v in p.get('acceptedAnswers',[])),q['id']
        else:
            q.pop('matchOptions',None)
            q['answerLabel']=' → '.join(next(o['text'] for o in q['options'] if o['id']==i) for i in q['correctIds'])
        assert q['type']!='reference' and q['explanation'],q['id']
    return bank

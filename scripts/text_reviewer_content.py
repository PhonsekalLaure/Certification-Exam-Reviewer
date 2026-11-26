"""Visually checked transcriptions of the supplied HTML/CSS and JavaScript PDFs.

Whitespace and UI instructions are adapted for native web controls. Clipped or
malformed source material is identified in notes; original marked keys stay in
the question bank and are not silently presented as corrected implementations.
"""
def entry(prompt, code='', labels=None, choices=None, options=None, **extra):
    return dict(prompt=prompt, exhibit=code, labels=labels, choices=choices, options=options, **extra)

HTML_TEXT = {
1: entry('For each statement about relative and absolute links, select Yes if it is true. Otherwise, select No.', labels=[
    'A relative link requires that you use a protocol and server path.',
    'You can link to a document in a subdirectory of the current webpage by specifying only the subdirectory name and the filename.',
    'You can use a relative link to reference image files from a repository on a different server.',
    'The following is an example of an absolute link: https://www.contoso.com/products.html'
], choices=['Yes','No']),
2: entry('You are creating a page on your personal website to display your family portrait. You need browsers to display the text Family Portrait before the photo is downloaded. Complete the markup. Each segment may be used once, more than once, or not at all.',
    '<[1] [2]="portrait.png" [3]="Family Portrait">',
    ['[1] Image element','[2] Image URL attribute','[3] Alternative-text attribute'],
    ['img','picture','src','title','href','alt']),
3: entry('Complete the link pseudo-class rules so links appear red when the page loads, green while being activated, orange when the pointer moves over them, and blue if previously visited. Each selector may be used once, more than once, or not at all.',
    '[1] { color: red; }\n[2] { color: blue; }\n[3] { color: orange; }\n[4] { color: green; }',
    ['[1] Red link','[2] Blue link','[3] Orange link','[4] Green link'],
    ['a:active','a:visited','a:link','a:hover']),
4: entry('You are designing a website for City Power & Light. You write the following markup. Line numbers are for reference only. What style will be used to render the code?',
    '''01 <!DOCTYPE html>
02 <html>
03 <head>
04   <title>City Power & Light</title>
05 </head>
06 <body>
07   <p>Welcome to City Power & Light.</p>
08 </body>
09 </html>''', options=[
    'The browser default style will be used.','An inline style will be used.','An international style will be used.','An external style will be used.'],
    explanation='The source answer is A. The markup supplies no author stylesheet or inline style, so the browser uses its default styles.'),
5: entry('The external stylesheet mystyles.css, the head markup, and the body content are shown below. For each statement, select Yes if it is true. Otherwise, select No.',
    '''/* mystyles.css */
h1 { color: blue; }
h2 { color: purple; }
p  { color: grey; }

<!-- Head markup -->
<link rel="stylesheet" type="text/css" href="mystyles.css">
<style>
  h1 { color: maroon; }
  h2 { color: blue; }
  p  { color: black; }
</style>

<!-- Body content -->
<h1 style="color: black;">AdventureWorks Presents</h1>
<h2>Rock Climbing 101</h2>
<p style="color: blue;">Coming soon!</p>
<h1>Awards</h1>
<p>Certificates will be awarded in June.</p>''',
    ['“Certificates will be awarded in June.” is displayed in grey.','“Coming soon!” is displayed in blue.','“Awards” is displayed in maroon.','“Rock Climbing 101” is displayed in purple.'],['Yes','No']),
6: entry('Analyze the following CSS and HTML. What is the resulting background color of the paragraph element?',
    '''<!DOCTYPE html>
<html>
<head>
  <style>
    p { background-color: blue; }
    .light { background-color: yellow; }
    .light p { background-color: green; }
  </style>
</head>
<body>
  <div class="light" style="background-color: pink;">
    <p>This is some sample text</p>
  </div>
</body>
</html>''', options=['Pink','Blue','Yellow','Green'],
    caveat='The PDF marks A (Pink), but the paragraph is directly matched by .light p and therefore has a green background. The pink inline background belongs to the enclosing div; background-color is not inherited. The source key is retained for comparison and is excluded from standard practice.'),
7: entry('You are building a website with Home, Product Info, and Contact Us links. You will create a hierarchy of page elements and revise the stylesheets. You want to apply a style to all elements in a document. Which selector should you use?', options=['+','>',':','*']),
8: entry('You are designing a website for Margie’s Travel. The website uses external stylesheets. Complete a CSS rule that centers all h1 elements. Each segment may be used once, more than once, or not at all.',
    '[1] { [2]: [3]; }', ['[1] Selector','[2] Property','[3] Value'],['text-align','center','h1','=','.', '.h1']),
9: entry('For each statement about CSS, select Yes if it is true. Otherwise, select No.', labels=[
    'A CSS comment starts with /* and ends with */.',
    'Percent and EM are relative measurements, and the size of each depends upon its parent.',
    'Pixels are recommended units for specifying size.',
    'The font-family attribute helps ensure maximum compatibility between web browsers.'
], choices=['Yes','No'], caveat='The PDF marks Yes, No, No, No. Its unit and compatibility statements are too broad for a universal key: the reference for a percentage depends on the property, and em for font-size differs from em used in other properties. Keep this wording and key in context.'),
10: entry('You define the following styles and HTML. Use the answer fields to identify the color and font size of the referenced lines.',
    '''<style>
  #style1 { color: red; font-size: 30px; }
  #style2 { color: blue; font-size: 40px; }
  #style3 { color: green; font-size: 20px; }
</style>

01 <body style="color: purple; font-size: 10px;">
02   <p id="style1">Fasten your seat belt</p>
03   <p>Look both ways before pulling out.</p>
04   <p id="style3" style="color: red;">Watch your speed.</p>
05   <p style="color: green; font-size: 20px;">Be ready to stop.</p>
06   <p style="color: red;">Study the rules of the road.</p>
07   <p style="font-size: 30px;">You’ll be driving in no time.</p>
08 </body>''', ['Line 02: text color','Line 02: font size','Line 03: text color'],
    [['red','blue','green','purple'],['20 pixels','30 pixels','40 pixels','10 pixels'],['red','blue','green','purple']],
    caveat='The PDF selects red, 30 pixels, and red. Line 03 has no matching ID or author color rule in the shown code and instead inherits purple from body. The first two selections follow #style1; the final red selection is inconsistent with the exhibit.'),
11: entry('You are creating a website for Northwind Traders. The company name must appear on the browser tab, and a paragraph must greet users. Arrange all markup segments into a correctly structured HTML document.'),
12: entry('You are creating a simple HTML page that displays Hello World. Complete the document using well-formed markup. Each tag may be used once, more than once, or not at all.',
    '''<[1]>
<[2]>
  <[3]>
    Hello World
  </[4]>
</[5]>''', ['[1] Document-type declaration','[2] Root element','[3] Content element','[4] Closing content element','[5] Closing root element'],['body','html','DOCTYPE html!','head']),
13: entry('You are designing a webpage for Contoso using HTML. Select four markup segments for the head section and arrange them in order. The source permits more than one valid order, but its displayed answer is malformed. Review this exercise as a study reference.',
    '''Available source segments:
<meta charset="utf-8">
<!DOCTYPE html>
<title>About Contoso</title>
<header>New Releases</header>
<head/>
<h3>Contact Us</h3>
<head>
<"meta enctype="utf-8>''',
    answerExhibit='''Source diagram’s selected segments:
<!DOCTYPE html>
<head>
<title>About Contoso</title>
<head/>

Concept reference, distinct from the malformed source key:
<head>
  <meta charset="utf-8">
  <title>About Contoso</title>
</head>''',
    explanation='The source answer places a document-type declaration inside a head-section exercise and uses <head/> instead of a closing </head>. A head section can contain character-encoding metadata and a title; the doctype belongs before the document element. The example labeled Concept reference shows the distinction. This source item is not scored.'),
14: entry('You are creating the Blue Yonder Airlines home page. It uses JavaScript and must display “Your browser does not support JavaScript!” when scripting is unavailable. Match a metadata element to each content or attribute-value pair. Each element may be used once, more than once, or not at all. The source’s completed diagram is incomplete, so this is a study reference.',
    '''Available elements:
<script>  <meta>  <title>  <noscript>  <base>

Targets:
1. href="style.css"
2. src="_js/form.js"
3. Blue Yonder Airlines
4. Your browser does not support JavaScript!''',
    answerExhibit='''Source diagram:
<meta> next to href="style.css"; the other target boxes are unfilled.

Concept reference:
External JavaScript: <script src="_js/form.js"></script>
Page title: <title>Blue Yonder Airlines</title>
Fallback: <noscript>Your browser does not support JavaScript!</noscript>
External stylesheet: <link rel="stylesheet" href="style.css">''',
    explanation='The source leaves target boxes blank and omits link from its choices even though style.css is a stylesheet. Its marked meta placement is not a stylesheet link. The concept reference supplies the appropriate elements without inventing a complete original key. This exercise is not scored.'),
15: entry('You are designing a responsive webpage. For browser widths below 768 pixels, display the welcome background SmallLogo.png. On other browsers, display NormalLogo.png. Complete the code using the provided choices.',
    '''.welcome {
  background-image: url([1]);
}
@media only screen and ([2]: 768px) {
  .welcome {
    background-image: url([3]);
  }
}''', ['[1] Default background image','[2] Media-query feature','[3] Background image inside the media query'],
    [['NormalLogo.png','SmallLogo.png'],['min-width','max-width'],['NormalLogo.png','SmallLogo.png']]),
16: entry('A webpage contains the following HTML. For each layout statement, select Yes if it is true. Otherwise, select No.',
    '''01 <div style="position: relative; display: inline;">Welcome!</div>
02 <div style="position: relative; display: inline;">
03   How is the Internet different from the Web?
04   <img src="icon.jpg" alt="TCP/IP icon" style="float: left; height: 200px;" </img>
05   <p>The Internet is a network of networks, defined by the TCP/IP standards.</p>
06   <p>The Web is an information space.</p>
07 </div>''',
    ['Line 03 will display next to Line 01.','The image will display beneath the text on Line 03.','Lines 05 and 06 display beneath the image.'],['Yes','No'],
    caveat='The PDF marks all three statements Yes. The shown img tag is malformed, and the paragraphs have no clear rule to force them below the left-floated image; text may wrap beside it depending on available space. Preserve the source’s key as a source reference, not a reliable universal layout prediction.'),
17: entry('You are reviewing the CSS below. The source says you apply the productBox style to a div and claims it will display white text on a green background. Select “No change is needed” if that claim is correct; otherwise, select the replacement description.',
    '.product {\n  color: #000000;\n  background-color: #00FF00;\n}',
    options=['No change is needed.','White text on a red background.','Black text on a green background.','Black text on a blue background.'],
    caveat='The PDF marks C, which describes #000000 text and #00FF00 background if the shown rule matches. However, the selector is .product while the prompt names productBox. That mismatch must be resolved before predicting an actual element’s appearance.'),
18: entry('You are creating an About Us page for Northwind Traders. Its example paragraph uses blue italic text, a 50-pixel line height, and a 1.5em font size. Complete the four CSS property names in the source rule.',
    '''p {
  [1]: #000ff;
  [2]: 50px;
  [3]: 1.5em;
  [4]: italic;
}''', ['[1] Text-color property','[2] Line-spacing property','[3] Text-size property','[4] Italic-text property'],
    [['color','font-variant','border-color','background-color'],['position','line-height','text-indent','letter-spacing'],['font-size','font-variant','font-weight'],['font-style','font-family','font-variant','font-weight']],
    caveat='The selected property names are color, line-height, font-size, and font-style. The source displays the five-digit value #000ff, which is not valid CSS hexadecimal color syntax. Blue would conventionally be #0000ff or #00f. The transcription preserves the source literal and flags it.'),
19: entry('Analyze the following background declaration. For each statement, select Yes if it is true. Otherwise, select No.',
    'background: #0000FF url("Watermark.png") repeat-x right;',
    ['The background of the page will be red.','The page will display the watermark multiple times horizontally starting at the right.'],['Yes','No'],
    caveat='The PDF marks both statements No. #0000FF is blue, so the first No is appropriate. repeat-x requests horizontal repetition and right sets horizontal positioning, making the source’s second No questionable as worded. Read the actual declaration rather than memorizing that selection.'),
20: entry('Evaluate the term “Static positioning” in this statement: “Static positioning places an element at specific coordinates relative to the page or the element’s container.” Select “No change is needed” if the statement is correct; otherwise, choose its replacement.', options=['No change is needed.','Absolute positioning','Relative positioning','Fixed positioning'],
    caveat='The PDF marks C (Relative positioning). For explicit placement relative to a containing block, B (Absolute positioning) is the conventional intended description. Relative positioning offsets an element from its own normal-flow position. The original key is retained but excluded from standard practice.'),
21: entry('Create a stylesheet that makes all h1 text blue, Arial, 20 pixels, bold, and center-aligned. Complete each property name. A property may be used once, more than once, or not at all.',
    '''h1 {
  [1]: blue;
  [2]: Arial;
  [3]: 20px;
  [4]: bold;
  [5]: center;
}''', ['[1] blue','[2] Arial','[3] 20px','[4] bold','[5] center'],
    ['color','font-family','font-size','font-style','font-weight','text-align','text-decoration-color','vertical-align']),
22: entry('You are designing a webpage that displays contoso.png. If the connection is slow, or the user is visually impaired, the text Contoso Logo must be displayed or read aloud. Complete the markup.',
    '<[1] [2]="contoso.png" [3]="Contoso Logo">', ['[1] Image element','[2] Source attribute','[3] Text-alternative attribute'],
    [['img','picture'],['src','srcset'],['alt','title']]),
23: entry('Create a webpage that displays the How-To video HowTo.mp4 from the same folder. Users must be able to play, pause, and seek. If HTML5 video is unsupported, display “Your browser does not support playing this video.” Complete the markup. Segments may be reused or omitted.',
    '''<[1]>
  [2]
  Your browser does not support playing this video.
</[3]>''', ['[1] Opening element and attributes','[2] MP4 source element','[3] Closing element'],
    ['source','source controls','<source src="HowTo.mp4" type="video/mp4">','video','video controls','<video src="HowTo.mp4" type="video/mp4">']),
24: entry('Display an HTML5 logo on a webpage. If the page renders slowly, display the text HTML Icon while the image loads. Complete the image element, file attribute, and text-alternative attribute.',
    '<[1] [2]="html15.gif" [3]="HTML Icon">', ['[1] Element','[2] File attribute','[3] Alternative-text attribute'],
    [['figure','img','div'],['href','src','target'],['alt','name','title']],
    explanation='Use img, src, and alt. The source screenshot clips the right-hand attribute value; this text version uses HTML Icon, which is explicitly required by its prompt. There is no separately recoverable width field to answer.'),
}

JS_TEXT = {
1: entry('You are creating a webpage that tests a user’s ability to accurately type text. Validation must be case-insensitive. Complete the function using the supplied segments; each segment may be reused or omitted. tester is the input element and userText contains the text to match.',
    '''function validate() {
  var input = document.getElementById("tester").[1];
  var text = document.getElementById("userText").[2];
  if (input.[3] == text.[4]) {
    alert("Success");
  }
}''', ['[1] Input-element property','[2] Text-element property','[3] Normalize the input string','[4] Normalize the expected string'],['value','innerHTML','toLowerCase()']),
2: entry('Evaluate the code. What final values for sampleStudent, sampleCourse.name, and sampleCourse.grade are output by console.log?',
    '''function change(student, course) {
  student = "JavaScript Student";
  course.name = "JavaScript";
  course.grade = 100;
}
var sampleCourse = { "name": "HTML", "grade": 90 };
var sampleStudent = "HTML Student";
change(sampleStudent, sampleCourse);
console.log(sampleStudent, sampleCourse.name, sampleCourse.grade);''',
    ['sampleStudent','sampleCourse.name','sampleCourse.grade'],[['HTML Student','JavaScript Student'],['HTML','JavaScript'],['90','100']]),
3: entry('An array is initialized and modified as shown. Which four elements does it contain afterward, in sequence? Arrange the resulting values in order.',
    '''var array = [20, 40, 60, 80];
array.shift();
array.pop();
array.push(10);
array.unshift(100);''', orderingDistractors=['20','80']),
4: entry('Evaluate the following code segment. Line numbers are for reference only. For each referenced console.log call, select the value it writes to the console.',
    '''01 var n;
02 console.log(typeof n);
03 var a = "3.4";
04 console.log(typeof a);
05 var textArray = ["Welcome Back", "Enter a Name", "Incorrect Answer"];
06 console.log(typeof textArray);
07 var c = 2.4;
08 console.log(typeof c);
09 var tag = null;
10 console.log(typeof tag);''',
    ['Line 02: typeof n','Line 04: typeof a','Line 06: typeof textArray','Line 08: typeof c','Line 10: typeof tag'],['string','array','object','number','undefined']),
5: entry('You are writing an engineering application that rounds numbers to three or more decimal places. A function receives value, the number to format, and digits, the number of decimal digits to display. Which function returns the value with the specified number of decimal digits?', options=[
    'function significance(value, digits) {\n  return value.toPrecision(digits);\n}',
    'function significance(value, digits) {\n  return value.toString(digits);\n}',
    'function significance(value, digits) {\n  return value.toFixed(digits);\n}',
    'function significance(value, digits) {\n  return value.valueOf(digits);\n}'
]),
6: entry('Analyze the following code fragment. Line numbers are for reference only. For each statement, select Yes if it is true. Otherwise, select No.',
    '''01 "use strict";
02 var val1 = 25;
03 var val2 = 4;
04 function multiply() {
05   return val1 * val2;
06 }
07
08 console.log("Global multiply returns() : " + multiply());
09 multiply();
10
11 function getProduct() {
12   var val1 = 2;
13   var val2 = 3;
14
15   function multiply() {
16     return val1 * val2;
17   }
18
19   return multiply();
20 }''', ['The call to multiply on line 09 returns 100.','The call to multiply on line 19 returns 100.'],['Yes','No']),
7: entry('Create a JavaScript function that accepts a number of months to add to or subtract from the current date and returns the adjusted Date. Complete the three code segments.',
    '''function adjustMonth(value) {
  [1]
  [2]
  [3]
  return date;
}''', ['[1] Initialize the current date','[2] Read its current month','[3] Update the month'],[
    ['var date = new Date();','var date = Date();','var date = new Date;','var date = Date;'],
    ['var month = date.getMonth;','var month = getMonth();','var month = date.getMonth();','var month = getMonth;'],
    ['date.setMonth(month + value);','setMonth(month + value);']
], caveat='The PDF selects new Date(), date.getMonth(), and date.setMonth(month + value). Those choices work, but new Date without parentheses is also valid JavaScript when no arguments are passed. Because the first dropdown contains two valid constructions, the source does not provide a unique key for that field.'),
8: entry('You are writing a script for Adventure Works. It must declare and initialize an array, fill it with ten random integers, and add every other number beginning with the first element. Complete the code.',
    '''var numbers = [1];
for (var i = 0; i < 10; i++) {
  numbers.[2](Math.round(Math.abs(Math.random() * 10)));
}
var sum = 0;
for (var j = 0; j < 10; j = [3]) {
  sum += [4];
}
console.log(sum);''', ['[1] Array initializer','[2] Add a number to the array','[3] Update j','[4] Array element to add'],
    [['0','{}','[]','""'],['pop','push','sort','splice'],['j++','j+1','j+2','j--'],['sum[j]','numbers[j]','numbers(j)','array[j]']],
    caveat='The PDF selects [], push, j++, and array[j]. However, j = j++ assigns the old value back and fails to advance the loop; every-other-element traversal calls for j = j+2. The declared array is numbers, so the element expression should be numbers[j], not array[j]. The source key is retained but excluded from standard practice.'),
9: entry('A JavaScript program for Blue Yonder Airlines initializes the variables below. Select the data type of each referenced variable based on its initialized value.',
    '''01 var flightDestination = "Denver";
02 var flight = 5;
03 var roundTrip = 2489.58;
04 var onTime = true;
05 var id = flight + flightDestination;''',
    ['Line 01: flightDestination','Line 03: roundTrip','Line 04: onTime'],['Number','String','Boolean','Null','Undefined']),
10: entry('You are planning to use the Math object in a JavaScript application. Evaluate the code and select the final value of each variable.',
    '''var ceil = Math.ceil(100.5);
var floor = Math.floor(100.5);
var round = Math.round(100.5);''', ['ceil','floor','round'],['100','101']),
11: entry('You want to initialize a Date object for January 1, 2017 using numeric year, month, and day parameters. Select the year and month. The day value is fixed to 1 below from the explicit requirement; the PDF cuts off that part of the expression.',
    'var date = new Date([1], [2], 1);', ['[1] Year','[2] Month'],[['17','2017'],['0','1','Jan','January']],
    explanation='The visible source selections are 2017 and 0. Numeric Date months are zero-based, so January is 0. The day argument 1 is supplied by the prompt’s January 1 requirement, rather than recovered from the clipped screenshot.'),
12: entry('Write a program that advises a person to ride a bike when the temperature is above 65 degrees and it is not raining. Otherwise, advise taking the train if the car has half a tank of gas or less, and driving the car when it has more fuel. Complete the source’s conditional structure.',
    '''if (temperature > 65 [1] !raining)
  advice = "Ride Bike";
else if (fuelTank [2] .5)
  advice = "Take Train";
else
  advice = "Drive your car";''', ['[1] Combine the weather conditions','[2] Compare the fuel level'],[['&&','==','||','&','>'],['==','||','<=','&&','>']]),
13: entry('Create ticketPrice(age). Customers younger than 5 or at least 65 enter free. Customers aged 5 through 17 pay $10 USD; everyone else pays $20 USD. Complete the conditions.',
    '''function ticketPrice(age) {
  var price = 20;
  [1]
    price = 0;
  }
  [2]
    price = 10;
  }
  return price;
}''', ['[1] Free-admission condition','[2] Youth-price condition'],[
    ['if (age <= 5 && age > 65) {','if (age < 5 && age >= 65) {','if (age <= 5 || age > 65) {','if (age < 5 || age >= 65) {'],
    ['if (age >= 5 && age < 18) {','if (age > 5 && age <= 18) {','if (age >= 5 || age < 18) {','if (age > 5 || age <= 18) {']
]),
14: entry('Write a JavaScript function that accepts a weekday string and returns the appropriate discount. Complete lines 03, 04, and 07 of the source function.',
    '''01 function getDiscount(day) {
02   var discount = 0;
03   [1]
04     [2]
05       discount = .1;
06       break;
07     [3]
08       discount = 0;
09       break;
10   }
11   return discount;
12 }''', ['[1] Line 03','[2] Line 04','[3] Line 07'],[
    ['case (day) {','default (day) {','case (default) {','switch (day) {'],
    ['case "Wednesday":','default:','case default:','switch "Wednesday"'],
    ['case "Wednesday":','default:','case default:','switch "Wednesday"']
]),
15: entry('Write a loop that traverses an array named list to find orange. If an element is null, immediately go to the next element. When orange is found, exit the loop. Complete the three keywords. The source clips the array literal and the right edge of the loop header; only those clipped portions are annotated below.',
    '''function doWork() {
  // list: source array; its literal is clipped in the PDF.
  [1] (i = 0; i < list.length; /* update clipped */) {
    if (list[i] == null)
      [2]
    if (list[i] == 'orange') {
      alert('found');
      [3]
    }
    console.log(list[i]);
  }
}''', ['[1] Loop keyword','[2] Skip the null element','[3] Stop after finding orange'],['for','break','continue','while','do']),
16: entry('Create countdown(start), which displays the numbers from start down to and including zero in increments of one. Complete the three portions of the for header.',
    '''function countdown(start) {
  for ([1] [2] [3]) {
    console.log(i);
  }
}''', ['[1] Initializer','[2] Condition','[3] Update'],[
    ['var i = start;','var i == start;','var i <= start;','var i < start;'],
    ['i <= 0;','i < 0;','i > 0;','i >= 0;'],['++i','+i','--i','-i']
]),
17: entry('You are creating a calendar application and need to determine the number of days for each month. Complete the three visible code segments. The supplied source cuts off the remainder after the 30-day case; that missing remainder is not invented here.',
    '''var daysInMonth;
var month;
month = new Date().getMonth();
[1]
  case 1:
    daysInMonth = 28; // February; ignore leap years.
    [2]
  case 3:
  case 5:
  case 8:
  case 10:
    daysInMonth = 30;
    [3]
  // Remaining source content is clipped.
}''', ['[1] Dispatch by month','[2] End the February case','[3] End the 30-day case'],
    [['switch (month) {','case (month) {','break {'],['break;','continue;','while (month);'],['break;','continue;']]),
18: entry('Create a safe-division check with numerator and denominator parameters. It should return false when the denominator is zero and true otherwise. Review the code, then select Yes or No for each statement.',
    '''01 function isSafeDivide(numerator, denominator) {
02   if (denominator = 0) {
03     return false;
04   } else {
05     return true;
06   }
07 }''', ['The function will always return false.','The operator at line 02 should be !=.'],['Yes','No'],
    explanation='The source marks No and No. Line 02 assigns 0 to denominator rather than comparing it; the assigned value is falsy, so this code takes the else branch. To meet the requirement, compare the denominator with zero (for example, denominator === 0), rather than replacing the operator with !=.'),
19: entry('Variable x has the value 5 and variable y has the value 7. Select True if each expression evaluates to true. Otherwise, select False.',
    'var x = 5;\nvar y = 7;', ['x < 7 && y > 6','x == 6 || y == 6','x !== 7','!(x == y)'],['True','False']),
20: entry('You are developing a webpage that displays information using popup boxes. Match alert, confirm, and prompt with their scenarios. The scenario descriptions are cut off in the supplied PDF, so the mappings below are a clearly labeled concept reference rather than a recovered scoring key.',
    'Available functions:\nalert\nconfirm\nprompt',
    answerExhibit='''Visible source order:
prompt  → [scenario description clipped]
alert   → [scenario description clipped]
confirm → [scenario description clipped]

Concept reference:
prompt  → Ask the user to enter text.
alert   → Show an informational message.
confirm → Ask the user to accept or cancel.''',
    explanation='The standard browser functions are prompt for text input, alert for a message, and confirm for an accept/cancel choice. The original scenario wording cannot be recovered from the clipped source, so this exercise remains study-only.'),
21: entry('You are designing unitTest(expression) to invoke library functions using the source’s eval call. If invocation throws an exception, display “The function does not exist.” Complete the exception-handling keywords.',
    '''function unitTest(expression) {
  [1] {
    eval(expression);
  }
  [2] (err) {
    alert("The function does not exist.");
  }
}''', ['[1] Protect the invocation','[2] Handle its exception'],['catch','finally','try']),
}


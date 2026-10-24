# Reflection – Web Foundations Course

---

## What Was the Most Difficult Concept?

The most difficult concept in this course was asynchronous
JavaScript. When I first wrote a fetch request I could not
understand why the code kept running before the data came
back from the server, and why my variables were sometimes
undefined when I tried to use them. I overcame this by
building the QuickNotes API client one step at a time.
Each time I made a mistake I opened the browser console,
read the error carefully and traced it back to where the
data was being used before it had arrived. Writing try,
catch and finally around every fetch call helped me see
the pattern clearly. By the end of Project 2 async and
await felt natural and I understood why they exist: the
browser cannot freeze while waiting for a server to reply.

## Which Part of My Capstone Would I Improve?

Based on the feedback I received I would improve the
error messages in the QuickNotes API client. Currently
when the title field is empty the error appears in the
status paragraph at the top of the page, which the user
may not see if they have scrolled down to the form. I
would add a red border directly on the input that failed
and show a small message directly below it so the user
knows exactly which field to fix without scrolling. I
would also add a live character counter below the title
input so users can see how close they are to the 100
character limit before they submit.

## What Will I Learn Next?

Next I will learn React JS. This course taught me how to
build pages with HTML, CSS and JavaScript and how to
connect them to an API using fetch. React will let me
build larger applications where the page updates
automatically when data changes without a full reload.
I chose React because it is used by Safaricom and most
technology companies I want to work for in Kenya. My
first React project will be a rebuilt version of
QuickNotes so I can compare it directly with the plain
JavaScript version I built in this course.
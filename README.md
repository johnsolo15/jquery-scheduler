# jQuery-scheduler
#### What?
This is a simple jQuery plugin that allows for creation of events/appointments/reservations with clicking and dragging of the mouse. It provides a day view calendar with timeslots for multiple reservation items. Implementing is quick, and reqiures little development on the user's part. It is still in development with a lot of stuff to add, so this is only for deomonstration purposes.
#### Why?
This plugin was started because of the lack of simple day schedulers available. There is an abundace of full month calendar views, but nothing for a single day. I was working on a project for school that would create a reservation system for our 3d printers, but couldn't find anything to display reservations. This project is what I wish I had found 6 months a go.

## Demo
### [See it in action!]()

![Demo](https://github.com/johnsolo15/jquery-scheduler/blob/master/example/scheduler.png)

## Getting Started
### Install
* Clone the repository: `git clone https://github.com/johnsolo15/jquery-scheduler.git` 
* Download the zip file

Include files:
```
<link rel="stylesheet" href="/path/to/jquery.scheduler.css"></link>
<script src="/path/to/jquery.js"></script>
<script src="/path/to/date.format.min.js"></script>
<script src="/path/to/jquery.scheduler.js"></script>
 ```
 ### Use
Create a div with the id `id="scheduler"`:
```html
<div id="scheduler"></div>
```
Initialize it below with the `$.fn.scheduler` method:
```js
$("#scheduler").scheduler();
```
Putting it all together:
```html
<html>
<head>
    <link rel="stylesheet" href="jquery.scheduler.css"></link>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <script src="date.format.min.js"></script>
    <script src="jquery.scheduler.js"></script>
</head>

<body>
    <div id="scheduler"></div>
</body>  

<script>
    $("#scheduler").scheduler();
</script>
</html>
```
### Options
Coming soon...
## Acknowledgements
Big thanks to [jacwright](https://github.com/jacwright) for writing the [date.format library](https://github.com/jacwright/date.format) I used to help deal with that pesky javascript date object. 

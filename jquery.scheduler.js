(function ($) {
    
    var defaults = {
        startDate       : new Date(),
        startTime       : '7 AM',
        endTime         : '8 PM',
        use24Hour       : false,
        timeslotHeight  : 40,
        timeslotWidth   : 75,
        items           : ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6'],
        reservations    : []
    }
        
    $.fn.scheduler = function(options) {
        var settings = $.extend({}, defaults, options);
        
        return this.each(function() {
            render.calendar($(this), settings);
            setSize(settings.timeslotHeight, settings.timeslotWidth);
            date.set(settings.startDate);   
            attachEventListeners(settings);
            loadRsvns(settings.startDate, settings.reservations, settings);
        });
    }        
        
    // Render html for scheduler
    var render = {
        
        calendar: function(container, settings) {
            var header = render.header();
            var body = render.body(settings);
            
            container.append(header);
            container.append(body);
        },

        header: function() {
            var header = $("<div></div>").addClass("header");
            var dateHeader = $("<div></div>").addClass("date-header");

            header.append("<div class='prev button'>&#10094</div>")
            header.append("<div class='date'>January 1 1970</div>")
            header.append("<div class='next button'>&#10095</div>")
            
            return header;
        },

        body: function(settings) {
            var body = $("<div></div>").addClass("body");
            var rowHeader = render.rowHeader(settings);
            var timeslots = render.timeslots(settings);

            body.append(rowHeader);
            body.append(timeslots);

            return body;
        },

        rowHeader: function(settings) {
            var rowHeaderContainer = $("<div></div>").addClass("row-header-container");

            rowHeaderContainer.append("<div class='hour-header hour'>Printers</div>");
            var i;
            for (i = 0; i < settings.items.length; i++) {
                var header = $("<div></div>").addClass("row-header cell").text(settings.items[i]);
                rowHeaderContainer.append(header);
            }
          
            return rowHeaderContainer;
        },

        timeslots: function(settings) {
            var rowContainer = $("<div></div>").addClass("row-container");
            var columnHeader = $("<div></div>").addClass("column-header");
            var rsvnContainer = $("<div></div>").addClass("rsvn-container");
            
            var hours = getHours(settings);
            var i;
            for (i = 0; i < hours.length; i++) {
                var hour = $("<div></div>").addClass("hour").text(hours[i]);
                columnHeader.append(hour);
            }
            rowContainer.append(columnHeader);
            rowContainer.append(rsvnContainer);
          
            for (i = 0; i < settings.items.length; i++) {
                var row = $("<div></div>").addClass("row");
                rowContainer.append(row);
            
                var j;
                for (j = 0; j < hours.length; j++) {
                    var timeslot = $("<div></div>").addClass("timeslot cell");
                    row.append(timeslot);
                }
            }
          
            return rowContainer;
        }
    }
    
    // Attch event listeners for whole scheduler
    var attachEventListeners = function(settings) {
        $(".row").on("mousedown.newevent", {'settings': settings}, listeners.row);

        $(".prev").on('click', {'settings': settings}, listeners.prev);

        $(".next").on('click', {'settings': settings}, listeners.next);

        $(".date").on('click', {'settings': settings}, listeners.date);
     }
    
    // Event listener functions to attach
    var listeners = {
        
        row: function(e) {
            createRsvn.start(e);
        },
        
        prev: function(e) {
            var settings = e.data.settings;
            
            clearCalendar();
            date.change(false);
            loadRsvns(date.get(), settings.reservations, settings);
        },
        
        next: function(e) {
            var settings = e.data.settings;
            console.log(settings.reservations);
            clearCalendar();
            date.change(true);
            loadRsvns(date.get(), settings.reservations, settings);
        },
        
        date: function(e) {
            var settings = e.data.settings;
            var today = new Date();
            
            clearCalendar();
            date.set(today);
            loadRsvns(today, settings.reservations, settings);
        }
    }
    
    
    // Create a new rsvn with mouse click and drag
    var createRsvn = {
        
        start: function(e) {    
            var $newRsvn,
                settings = e.data.settings,
                posY = e.pageY - $(".rsvn-container").offset().top,
                posX = e.pageX - $(".rsvn-container").offset().left,
                top = posY - (posY % settings.timeslotHeight),
                left = posX - (posX % settings.timeslotWidth),
                height = settings.timeslotHeight + 1,
                width = settings.timeslotWidth + 1;
            
            var collisions = $(".reservation").filter(function() {
                    return $(this).position().top == top && $(this).position().left == left;
                }).not($newRsvn);

            if (collisions.length == 0) {            
                $newRsvn = $("<div></div>")
                .addClass("reservation reservation-creating")
                .css({
                    top: top,
                    left: left,
                    height: height,
                    width: width
                });
                
                $(".rsvn-container").append($newRsvn);
            }
            
            if ($newRsvn != undefined) {
                var eventData = {'rsvn': $newRsvn, 'left': left, 'settings': settings};
                
                $(".row-container").on("mousemove.newevent", eventData, createRsvn.resize);
                $(document).on("mouseup.newevent", eventData, createRsvn.end);
            }
        },
        
        resize: function(e) {
            var $newRsvn = e.data.rsvn,
                settings = e.data.settings,
                posX = e.pageX - Math.round($('.rsvn-container').offset().left),           
                remainder = posX % settings.timeslotWidth,
                left = e.data.left,
                start = posX > left ? left : posX - remainder,
                end = posX > left ? (remainder == 0 ? posX : posX + settings.timeslotWidth - remainder) : left + settings.timeslotWidth,
                width = end - start + 1;

            $newRsvn.css({
                left: start,
                width: width
            });
            
            $(".reservation").filter(function() {
                return $(this).position().top == $newRsvn.position().top;
            }).not($newRsvn).each(function(i, elem) {
                if (overlaps(elem, $newRsvn) == true) {
                    $newRsvn.addClass("reservation-error");
                    return false;
                } else {
                    if ($newRsvn.hasClass("reservation-error")) {
                        $newRsvn.removeClass("reservation-error");
                    }
                }
            });
        },
        
        end: function(e) {
            var $newRsvn = e.data.rsvn;
            
            if ($newRsvn.hasClass("reservation-error")) {
                $newRsvn.remove();
            } else {
                $newRsvn.removeClass("reservation-creating");
                $newRsvn.addClass("reservation-final");
            }
            $(".row-container").off("mousemove.newevent");
            $(document).off("mouseup.newevent");
        }   
    }
    
    // Functions to set or return the date on the scheduler
    var date = {
        
        get: function() {
            return new Date($(".date").text());
        },
        
        set: function(date) {
            var dateString = format(date, 'F j Y');
            
            $(".date").text(dateString);
        },
        
        change: function(dir) {
            var currDate = new Date($(".date").text()),
                newDate;
            
            if (dir == true) {
                currDate = currDate.getTime();
                newDate = new Date(currDate + 86400000);
            } else if (dir == false) {
                currDate = currDate.getTime();
                newDate = new Date(currDate - 86400000);
            }
            
            newDate = format(newDate, 'F j Y');
            
            $(".date").text(newDate);
        }
    }

    // Checks whether two elements are overlapping on the x-axis
    var overlaps = function(a, b) {
        function getPos(elem) {
            var left, width;
            left = $(elem).position().left;
            width = $(elem).width();
            return [Math.round(left), Math.round(left + width)]
        }
      
        function comparePos(p1, p2) {
            var r1 = p1[0] < p2[0] ? p1 : p2,
                r2 = p1[0] < p2[0] ? p2 : p1;
            return r1[1] > r2[0];
        }
      
        return comparePos(getPos(a), getPos(b));
    }

    // Sets the size of the scheduler timeslots
    var setSize = function(height, width) {
        $(".cell")
        .css({
            minHeight: height,
            minWidth: width,
            maxHeight: height,
            maxWidth: width
        });
        $(".hour")
        .css({
            minWidth: width,
            maxWidth: width
        });
    }
    
    // Gets an array of hours from the start and end time in settings, based on whether 24 hour time is set
    var getHours = function(settings) {
        var hours = [];
        if (settings.use24Hour == true) {
            var start = parseInt(settings.startTime.split(':')[0]),
                end = parseInt(settings.endTime.split(':')[0]);
           
            var i;
            for (i = start; i < end; i++) {
                hours.push(i + ":00");
            }
        } else {
            var times = ['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
                         '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'];

            var start = times.indexOf(settings.startTime),
                end = times.indexOf(settings.endTime);
            
            var i;
            for (i = start; i < end; i++) {
                hours.push(times[i]);
            }
                
        }
        return hours;   
    }
    
    // Clears all reservations off of the calendar
    var clearCalendar = function() {
        $("#scheduler").find(".reservation").remove();
    }
    
    /* 
     * Displays stored rsvns from an array specified in options passed in by the user
     * The array has a date in Y-m-d format, and hours in 24 hour time format
     *
     */
    var loadRsvns = function(date, rsvns, settings) {
        if (settings.use24Hour == true) {
            var firstHour = parseInt(settings.startTime.split(":")[0]),
                lastHour = parseInt(settings.endTime.split(":")[0]);
        } else {
            var firstHour = parseInt(settings.startTime.split(" ")[0].split(":")[0]),
                lastHour = parseInt(settings.endTime.split(" ")[0].split(":")[0]) + 12;
        }
        var $rsvns = [];
        date = format(date, 'Y-m-d');
        
        var i;
        for (i = 0; i < rsvns.length; i++) {
            if (rsvns[i].date == date) {
                var start = parseInt(rsvns[i].start.split(":")[0]),
                    end = parseInt(rsvns[i].end.split(":")[0]);
                    
                if ((start >= firstHour && start <= lastHour) && (end >= firstHour && end <= lastHour) && (rsvns[i].row <= settings.items.length)) {
                    var $rsvn = $("<div></div>"),
                        top = rsvns[i].row * settings.timeslotHeight,
                        height = settings.timeslotHeight + 1,
                        left = (start - firstHour) * settings.timeslotWidth,
                        width = (end - start) * settings.timeslotWidth + 1;
                    console.log(top, height, left, width);
                    $rsvn.addClass("reservation").addClass("reservation-final")
                    .css({
                        top: top,
                        height: height,
                        left: left,
                        width: width
                    });
                    
                    $rsvns.push($rsvn);
                } else {
                    console.log("Error: " + rsvns[i] + " is outside of the scheduler time frame");
                }
            }
        }
        for (i = 0; i < $rsvns.length; i++) {
            $(".rsvn-container").append($rsvns[i]);
        }
    }
    
    /*
     *Date formatting is adapted from
     *https://github.com/jacwright/date.format
     */
     
    // Simulates PHP's date function
    var format = function(date, format) {
        return format.replace(/(\\?)(.)/g, function(_, esc, chr) {
            return (esc === '' && replaceChars[chr]) ? replaceChars[chr].call(date) : chr;
        });
    };
    
    // Stores just English language months and days for now
    var lang = {
        shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        longDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
    
    // Defining patterns
    var replaceChars = {
        // Day
        d: function() { var d = this.getDate(); return (d < 10 ? '0' : '') + d; },
        D: function() { return lang.shortDays[this.getDay()]; },
        j: function() { return this.getDate(); },
        l: function() { return lang.longDays[this.getDay()]; },
        N: function() { var N = this.getDay(); return (N == 0 ? 7 : N); },
        S: function() { var S = this.getDate(); return (S % 10 == 1 && S != 11 ? 'st' : (S % 10 == 2 && S != 12 ? 'nd' : (S % 10 == 3 && S != 13 ? 'rd' : 'th'))); },
        w: function() { return this.getDay(); },
        z: function() { var d = new Date(this.getFullYear(),0,1); return Math.ceil((this - d) / 86400000); },
        // Week
        W: function() {
            var target = new Date(this.valueOf());
            var dayNr = (this.getDay() + 6) % 7;
            target.setDate(target.getDate() - dayNr + 3);
            var firstThursday = target.valueOf();
            target.setMonth(0, 1);
            if (target.getDay() !== 4) {
                target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
            }
            var retVal = 1 + Math.ceil((firstThursday - target) / 604800000);

            return (retVal < 10 ? '0' + retVal : retVal);
        },
        // Month
        F: function() { return lang.longMonths[this.getMonth()]; },
        m: function() { var m = this.getMonth(); return (m < 9 ? '0' : '') + (m + 1); },
        M: function() { return lang.shortMonths[this.getMonth()]; },
        n: function() { return this.getMonth() + 1; },
        t: function() {
            var year = this.getFullYear(), nextMonth = this.getMonth() + 1;
            if (nextMonth === 12) {
                year = year++;
                nextMonth = 0;
            }
            return new Date(year, nextMonth, 0).getDate();
        },
        // Year
        L: function() { var L = this.getFullYear(); return (L % 400 == 0 || (L % 100 != 0 && L % 4 == 0)); },
        o: function() { var d  = new Date(this.valueOf());  d.setDate(d.getDate() - ((this.getDay() + 6) % 7) + 3); return d.getFullYear();},
        Y: function() { return this.getFullYear(); },
        y: function() { return ('' + this.getFullYear()).substr(2); },
        // Time
        a: function() { return this.getHours() < 12 ? 'am' : 'pm'; },
        A: function() { return this.getHours() < 12 ? 'AM' : 'PM'; },
        B: function() { return Math.floor((((this.getUTCHours() + 1) % 24) + this.getUTCMinutes() / 60 + this.getUTCSeconds() / 3600) * 1000 / 24); },
        g: function() { return this.getHours() % 12 || 12; },
        G: function() { return this.getHours(); },
        h: function() { var h = this.getHours(); return ((h % 12 || 12) < 10 ? '0' : '') + (h % 12 || 12); },
        H: function() { var H = this.getHours(); return (H < 10 ? '0' : '') + H; },
        i: function() { var i = this.getMinutes(); return (i < 10 ? '0' : '') + i; },
        s: function() { var s = this.getSeconds(); return (s < 10 ? '0' : '') + s; },
        v: function() { var v = this.getMilliseconds(); return (v < 10 ? '00' : (v < 100 ? '0' : '')) + v; },
        // Timezone
        e: function() { return Intl.DateTimeFormat().resolvedOptions().timeZone; },
        I: function() {
            var DST = null;
                for (var i = 0; i < 12; ++i) {
                        var d = new Date(this.getFullYear(), i, 1);
                        var offset = d.getTimezoneOffset();

                        if (DST === null) DST = offset;
                        else if (offset < DST) { DST = offset; break; }                     else if (offset > DST) break;
                }
                return (this.getTimezoneOffset() == DST) | 0;
            },
        O: function() { var O = this.getTimezoneOffset(); return (-O < 0 ? '-' : '+') + (Math.abs(O / 60) < 10 ? '0' : '') + Math.floor(Math.abs(O / 60)) + (Math.abs(O % 60) == 0 ? '00' : ((Math.abs(O % 60) < 10 ? '0' : '')) + (Math.abs(O % 60))); },
        P: function() { var P = this.getTimezoneOffset(); return (-P < 0 ? '-' : '+') + (Math.abs(P / 60) < 10 ? '0' : '') + Math.floor(Math.abs(P / 60)) + ':' + (Math.abs(P % 60) == 0 ? '00' : ((Math.abs(P % 60) < 10 ? '0' : '')) + (Math.abs(P % 60))); },
		T: function() { var tz = this.toLocaleTimeString(navigator.language,{timeZoneName:'short'}).split(' '); return tz[tz.length - 1]; },
        Z: function() { return -this.getTimezoneOffset() * 60; },
        // Full Date/Time
        c: function() { return this.format("Y-m-d\\TH:i:sP"); },
        r: function() { return this.toString(); },
        U: function() { return this.getTime() / 1000; }
    };
     
}(jQuery));
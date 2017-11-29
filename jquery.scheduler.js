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
            var dateString = date.format('F j Y');
            
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
            
            newDate = newDate.format('F j Y');
            
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
        date = date.format('Y-m-d');
        
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
    
}(jQuery));

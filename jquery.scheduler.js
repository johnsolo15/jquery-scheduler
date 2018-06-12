(function ($) {
    
    var pluginName = 'scheduler';

    var defaults = {
        startDate       : new Date(),
        startTime       : '7 AM',
        endTime         : '8 PM',
        use24Hour       : false,
        timeslotHeight  : 40,
        timeslotWidth   : 75,
        items           : ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6']
    };

    var _private = {        
        //Render html for scheduler
        render: { 
            calendar: function() {
                var settings = $(this).data(pluginName).settings;
                var container = $(this);
                var header = _private.render.header();
                var body = _private.render.body(this);
                
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

            body: function(context) {
                var body = $("<div></div>").addClass("body");
                var rowHeader = _private.render.rowHeader(context);
                var timeslots = _private.render.timeslots(context);

                body.append(rowHeader);
                body.append(timeslots);

                return body;
            },

            rowHeader: function(context) {
                var items = $(context).data(pluginName).settings.items;
                var rowHeaderContainer = $("<div></div>").addClass("row-header-container");

                rowHeaderContainer.append("<div class='hour-header hour'></div>");
                var i;
                for (i = 0; i < items.length; i++) {
                    var header = $("<div></div>").addClass("row-header cell").text(items[i]);
                    rowHeaderContainer.append(header);
                }
            
                return rowHeaderContainer;
            },

            timeslots: function(context) {
                var items = $(context).data(pluginName).settings.items;
                var rowContainer = $("<div></div>").addClass("row-container");
                var columnHeader = $("<div></div>").addClass("column-header");
                var rsvnContainer = $("<div></div>").addClass("rsvn-container");
                var hours = _private.getHours.call(context);
                var i;
                for (i = 0; i < hours.length; i++) {
                    var hour = $("<div></div>").addClass("hour").text(hours[i]);
                    columnHeader.append(hour);
                }
                rowContainer.append(columnHeader);
                rowContainer.append(rsvnContainer);
            
                for (i = 0; i < items.length; i++) {
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
        },

        // Attch event listeners for whole scheduler
        attachEventListeners: function() {
            $(".row").on("mousedown.newevent", _private.listeners.row.bind(this));

            $(".prev").on('click', _private.listeners.prev.bind(this));

            $(".next").on('click', _private.listeners.next.bind(this));

            $(".date").on('click', _private.listeners.date.bind(this));
        },
        
        // Event listener functions to attach
        listeners: {
            row: function(e) {
                _private.createRsvn.start.call(this, e);
            },
            
            prev: function() {
                _private.clearCalendar.call(this);
                _private.date.change(false);
                _private.showRsvns.call(this, _private.date.get());
            },
            
            next: function() {
                _private.clearCalendar.call(this);
                _private.date.change(true);
                _private.showRsvns.call(this, _private.date.get());
            },
            
            date: function() {
                var today = new Date();
                
                _private.clearCalendar.call(this);
                _private.date.set(today);
                _private.showRsvns.call(this, today);
            }
        },

        // Create a new rsvn with mouse click and drag
        createRsvn: {
            start: function(e) {    
                var $newRsvn,
                    settings = $(this).data(pluginName).settings,
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
                    var eventData = {'rsvn': $newRsvn, 'left': left};
                    
                    $(".row-container").on("mousemove.newevent", eventData, _private.createRsvn.resize.bind(this));
                    $(document).on("mouseup.newevent", eventData, _private.createRsvn.end.bind(this));
                }
            },
            
            resize: function(e) {
                var $newRsvn = e.data.rsvn,
                    settings = $(this).data(pluginName).settings,
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
                    if (_private.overlaps(elem, $newRsvn) == true) {
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
        },

        // Functions to set or return the date on the scheduler
        date: {
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
        },

        // Checks whether two elements are overlapping on the x-axis
        overlaps: function(a, b) {
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
        },

        // Sets the size of the scheduler timeslots
        setSize: function() {
            var height = $(this).data(pluginName).settings.timeslotHeight,
                width = $(this).data(pluginName).settings.timeslotWidth;
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
        },
        
        // Gets an array of hours from the start and end time in settings, based on whether 24 hour time is set
        getHours: function() {
            var settings = $(this).data(pluginName).settings;
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
        },
        
        // Clears all reservations off of the calendar
        clearCalendar: function() {
            $(this).find(".reservation").remove();
        },
        
        /* 
        * Displays stored rsvns from an array specified in options passed in by the user
        * The array has a date in Y-m-d format, and hours in 24 hour time format
        *
        */
        showRsvns: function(date) {
            var date = date.format('Y-m-d'),
                settings = $(this).data(pluginName).settings,
                rsvns = $(this).data(pluginName).reservations[date] || [],
                $rsvns = [];
        
            if (settings.use24Hour == true) {
                var firstHour = parseInt(settings.startTime.split(":")[0]),
                    lastHour = parseInt(settings.endTime.split(":")[0]);
            } else {
                var firstHour = parseInt(settings.startTime.split(" ")[0].split(":")[0]),
                    lastHour = parseInt(settings.endTime.split(" ")[0].split(":")[0]) + 12;
            }
            
            var i;
            for (i = 0; i < rsvns.length; i++) {
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
            for (i = 0; i < $rsvns.length; i++) {
                $(".rsvn-container").append($rsvns[i]);
            }
        }
    };

    var methods = {
        init : function(options) {
            return this.each(function() {
                data = {
                    settings: $.extend({}, defaults, options),
                    reservations: {}
                };
                $(this).data(pluginName, data);
                _private.render.calendar.call(this);
                _private.setSize.call(this);
                _private.date.set(data.settings.startDate);   
                _private.attachEventListeners.call(this);
                _private.showRsvns.call(this, data.settings.startDate);
            });
        },

        loadRsvns: function(rsvns) {
            for (var i = 0; i < rsvns.length; i++) {
                this.data(pluginName).reservations[rsvns[i].date] = this.data(pluginName).reservations[rsvns[i].date] || [];
                this.data(pluginName).reservations[rsvns[i].date].push(rsvns[i]);
            }
            _private.showRsvns.call(this, data.settings.startDate);
        }
    };
        
    $.fn[pluginName] = function(option) {
        if (methods[option]) {
            return methods[option].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof option === 'object' || !option) {
            return methods.init.apply(this, arguments)
        } else {
            throw new Error('Method ' +  option + ' does not exist on jQuery.' + pluginName);
        }
    }        
    
}(jQuery));

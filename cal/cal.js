;(function(root) {
    
    var DEFAULT_OPTS = {
        'days_of_week': 'Su Mo Tu We Th Fr Sa'.split(' '),
        'month_names':  'January February March April May June July August September October November December'.split(' ')
    }

    var pad = function(i) {
        return (i < 10 ? '0' : '') + i;
    };
    
    var is_date_instance = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]'
    };
    
    var merge_objects = function() {
        var merged = {};
        var obj;
        console.log(arguments);
        for(var i = 0; i < arguments.length; i++) {
            obj = arguments[i];
            for(var key in obj) {
                if(obj.hasOwnProperty(key)) {
                    merged[key] = obj[key];
                }
            }
        }
        console.log(merged);
        return merged;
    };
    
    var create_element = function(tag, opts) {
        var el = document.createElement(tag);
        for(var key in opts) {
            if(opts.hasOwnProperty(key)) {
                el[key] = opts[key];
            }
        }
        return el;
    };
    
    var CalendarUtils = {
        MONTH_DAYS: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        
        is_leap: function(year) {
            return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
        },

        last_day: function(year, month) {
            return this.MONTH_DAYS[month] + ((month == 1 && this.is_leap(year) ? 1 : 0));
        },
        
        create_element: create_element,
        
        merge: merge_objects
    };

    var weekday_header = function(days_of_week) {
        var hdr = create_element('div', {'className': 'weekdays'});
        days_of_week = days_of_week || DEFAULT_OPTS.days_of_week;
        days_of_week.forEach(function(name) {
            hdr.appendChild(create_element('span', {'textContent': name}));
        });
        return hdr;
    };
    
    var month_select = function(month_names) {
        var div = create_element('div', {'className': 'selector'});
        var sel = create_element('select')
        div.appendChild(sel);
        month_names = month_names || DEFAULT_OPTS.month_names;
        month_names.forEach(function(name, i) {
            sel.appendChild(create_element('option', {'textContent': name, 'value': i}));
        });
        return div;
    };

    var CalendarDate = function(year, month, day, is_current) {
        this.year  = year;
        this.month = month;
        this.day   = day;
        this.is_current = !!is_current;
    };
    
    CalendarDate.prototype.new_day = function(day) {
        return new CalendarDate(this.year, this.month, day, this.is_current);
    };
    
    CalendarDate.prototype.prev_month = function() {
        var month = this.month, year = this.year;
        if(month == 0) {
            month = 11;
            --year;
        }
        else {
            --month;
        }
        return new CalendarDate(year, month, CalendarUtils.last_day(year, month));
    };
    
    CalendarDate.prototype.next_month = function() {
        var month = this.month, year = this.year;
        if(month == 1) {
            month = 0;
            ++year;
        }
        else {
            ++month;
        }
        return new CalendarDate(year, month, 1);
    };
    
    CalendarDate.prototype.toISOString = function() {
        return this.year + '-' + pad(this.month  + 1) + '-' + pad(this.day);
    };
    
    var calendar_day_element = function(cd, evt_handler, tag) {
        var child = create_element(tag || 'span', {'textContent': cd.day});
        if(!cd.is_current) {
            child.className = 'other';
        }
        if(evt_handler) {
            child.addEventListener('click', function() {
                var dtstring = this.dataset['date'];
                var dt = new Date(dtstring);
                evt_handler(dt, dtstring);
            }, false);
        }
        child.dataset['date'] = cd.toISOString();
        return child;
    };
    
    var calendar_range = function(value) {
        var dt     = value || new Date();
        var today  = new CalendarDate(dt.getFullYear(), dt.getMonth(), dt.getDate(), true);
        var offset = (new Date(today.year, today.month)).getDay();
        var days   = [];
        var i, j, prev, next;
        
        if(offset) {
            prev = today.prev_month();
            for(i = (prev.day - offset) + 1, j = prev.day; i <= j; i++) {
                days.push(prev.new_day(i));
            }
        }
        
        for(i = 1, j = CalendarUtils.last_day(today.year, today.month); i <= j; i++ ) {
            days.push(today.new_day(i));
        }
        
        offset = days.length % 7;
        if(offset) {
            next = today.next_month();
            for(i = 1, j = (7 - offset); i <= j; i++) {
                days.push(next.new_day(i))
            }
        }

        return days;
    };
    
    var create_calendar = function(el, opts) {
        var cal, i, j;
        var days = create_element('div', {'className': 'days'});
        
        el.appendChild(month_select());
        el.appendChild(weekday_header());
        el.appendChild(days);

        opts = merge_objects(DEFAULT_OPTS, opts || {});
        cal = calendar_range(opts.date || new Date());
        console.log(cal, cal.length % 7, cal.length);
        
        for(i = 0, j = cal.length; i < j; i += 1) {
            days.appendChild(calendar_day_element(
                cal[i],
                opts.onclick,
                opts.tag || 'span'
            ));
        }
    };
    
    root.Calendar = {
        create: create_calendar,
        range: calendar_range,
        Date: CalendarDate,
        Utils: CalendarUtils
    };
}(this));

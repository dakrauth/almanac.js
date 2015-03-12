;(function(root) {
    var MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    var DEFAULT_OPTS = {
        'days_of_week': 'Su Mo Tu We Th Fr Sa'.split(' '),
        'month_names':  'January February March April May June July August September October November December'.split(' '),
        'day_callback': null,
        'year_range': '-50'
    }

    var DOM = {
        create: function(tag, opts) {
            var el = document.createElement(tag);
            for(var key in opts) {
                if(opts.hasOwnProperty(key)) {
                    el[key] = opts[key];
                }
            }
            return el;
        },
        option: function(text, value) {
            return this.create('option', {'textContent': text, 'value': value});
        }
    };

    var Utils = {
        is_leap: function(yr) {
            return yr % 4 == 0 && (yr % 100 != 0 || yr % 400 == 0);
        },
        last_day: function(year, month) {
            return MONTH_DAYS[month] + ((month == 1 && this.is_leap(year) ? 1 : 0));
        },
        merge: function() {
            var merged = {};
            var obj;
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
        },
        is_date: function(obj) {
            return Object.prototype.toString.call(obj) === '[object Date]';
        },
        is_string: function(obj) {
            return typeof obj === 'string';
        },
        is_array: function(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        },
        pad: function(i) {
            return (i < 10 ? '0' : '') + i;
        },
        
        DOM: DOM
    };

    var weekday_header = function(days_of_week) {
        var hdr = DOM.create('div', {'className': 'weekdays'});
        days_of_week = days_of_week || DEFAULT_OPTS.days_of_week;
        days_of_week.forEach(function(name) {
            hdr.appendChild(DOM.create('span', {'textContent': name}));
        });
        return hdr;
    };
    
    
    var year_range = function(rel_yr, yr_rng) {
        var i, start;
        var neg = false;
        var range = [];
        
        if(Utils.is_string(yr_rng)) {
            if(yr_rng[0] == '-') {
                neg = true;
                yr_rng = yr_rng.substr(1);
            }
            if(yr_rng[0] == '+') {
                yr_rng = yr_rng.substr(1);
            }
            for(i = rel_yr - parseInt(yr_rng); i <= rel_yr; i++) {
                range.push(i);
            }
            return range;
        }
        
        if(yr_rng[0] < yr_rng[1]) {
            yr_rng = [yr_rng[1], yr_rng[0]];
        }
        
        return yr_rng;
    };
    
    var date_select = function(dt, opts) {
        var i, j, yr, mo, yr_rng;
        var div = DOM.create('div', {'className': 'selector'}),
          month = DOM.create('select', {'className': 'month'}),
           year = DOM.create('select', {'className': 'year'});
           
        dt = dt || new Date();
        mo = dt.getMonth();
        
        div.appendChild(month);
        div.appendChild(year);
        (opts.month_names || DEFAULT_OPTS.month_names).forEach(function(name, i) {
            month.appendChild(DOM.option(name, i));
            if(i == mo) {
                month.selectedIndex = i;
            }
        });
        
        yr = dt.getFullYear();
        yr_rng = year_range(yr, opts.year_range || DEFAULT_OPTS.year_range);
        
        for(j = 0; j < yr_rng.length; j++) {
            year.appendChild(DOM.option(yr_rng[j], yr_rng[j]));
            if(yr_rng[j] == yr) {
                year.selectedIndex = j;
            }
        }
        
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
        return new CalendarDate(year, month, Utils.last_day(year, month));
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
        return this.year + '-' + Utils.pad(this.month  + 1) + '-' + Utils.pad(this.day);
    };
    
    var calendar_day_element = function(cdt, tag, callback) {
        var child = DOM.create(tag || 'span', {'textContent': cdt.day});
        if(!cdt.is_current) {
            child.className = 'other';
        }
        child.dataset['date'] = cdt.toISOString();
        if(callback) {
            callback(child, cdt)
        }
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
        
        for(i = 1, j = Utils.last_day(today.year, today.month); i <= j; i++ ) {
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
        var cal, i, j, selectors;
        var days = DOM.create('div', {'className': 'days'}),
            dt = opts.date || new Date();
        
        opts = Utils.merge(DEFAULT_OPTS, opts || {});
        cal = calendar_range(dt);
        console.log(cal, cal.length % 7, cal.length);

        selectors = date_select(dt, opts);
        el.appendChild(selectors);
        el.appendChild(weekday_header());
        el.appendChild(days);

        for(i = 0, j = cal.length; i < j; i += 1) {
            days.appendChild(calendar_day_element(
                cal[i],
                opts.tag || 'span',
                opts.day_callback
            ));
        }
    };
    
    root.Calendar = {
        create: create_calendar,
        range: calendar_range,
        Date: CalendarDate,
        Utils: Utils
    };
}(this));

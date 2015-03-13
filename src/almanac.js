/* @preserve Version 0.1, Copyright (c) 2015 David A Krauth */
;(function(root) {
    var MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    var DEFAULT_OPTS = {
        days_of_week: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        day_post_create: null,
        year_range: '-50',

        month_tag: 'div',
        month_class: 'month',
        week_tag: 'div',
        week_class: 'week',
        day_tag: 'div',
        day_class: 'day',
        day_num_tag: 'span',
        day_num_class: 'day-num',
        
        weekday_wrapper_tag: 'div',
        weekday_wrapper_class: 'weekdays',
        weekday_tag: 'span',
        
        selector_tag: 'div',
        selector_class: 'selector',
        selector_month_class: 'month-select',
        selector_year_class: 'year-select'
    };

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

    var weekday_header = function(opts) {
        var hdr = DOM.create(opts.weekday_wrapper_tag, {className: opts.weekday_wrapper_class});
        opts.days_of_week.forEach(function(name) {
            hdr.appendChild(DOM.create(opts.weekday_tag, {'textContent': name}));
        });
        return hdr;
    };

    var parse_year_range = function(val, rel) {
        var end, incr;
        var range = [];
        rel = rel || (new Date()).getFullYear();
        val = parseInt(val);
        incr = val < 0 ? -1: 1;
        end = rel + val;
        
        for(; rel != end; rel += incr) {
            range.push(rel);
        }
        return range;
    };

    var date_select = function(dt, opts) {
        var j, yr, mo, yr_rng;
        var div = DOM.create(opts.selector_tag, {'className': opts.selector_class});
        var month = DOM.create('select', {'className': opts.selector_month_class});
        var year = DOM.create('select', {'className': opts.selector_year_class});
        
        var onchange = function() {
            var month_sel = this.parentElement.querySelector('select[data-type="month"]');
            var year_sel = this.parentElement.querySelector('select[data-type="year"]');
            var container = this.parentElement.parentElement;
            var month_el = container.querySelector('.' + opts.month_class);
            
            var month = parseInt(month_sel.value);
            var year =  parseInt(year_sel.value);
            var dt = new Date(year, month);
            container.replaceChild(create_days(dt, opts), month_el);
        };
        
        month.dataset['type'] = 'month';
        month.addEventListener('change', onchange, false);
        
        year.dataset['type'] = 'year';
        year.addEventListener('change', onchange, false);
        
        dt = dt || new Date();
        mo = dt.getMonth();
        
        div.appendChild(month);
        div.appendChild(year);
        opts.month_names.forEach(function(name, i) {
            month.appendChild(DOM.option(name, i));
            if(i == mo) {
                month.selectedIndex = i;
            }
        });
        
        yr = dt.getFullYear();
        yr_rng = opts.year_range || DEFAULT_OPTS.year_range, yr
        if(Utils.is_string(yr_rng)) {
            yr_rng = parse_year_range(yr_rng, yr);
        }
        
        for(j = 0; j < yr_rng.length; j++) {
            year.appendChild(DOM.option(yr_rng[j], yr_rng[j]));
            if(yr_rng[j] == yr) {
                year.selectedIndex = j;
            }
        }
        
        return div;
    };

    var AlmanacDay = function(year, month, day, is_current) {
        this.year  = year;
        this.month = month;
        this.day   = day;
        this.is_current = !!is_current;
    };
    
    AlmanacDay.prototype.new_day = function(day) {
        return new AlmanacDay(this.year, this.month, day, this.is_current);
    };
    
    AlmanacDay.prototype.prev_month = function() {
        var month = this.month, year = this.year;
        if(month == 0) {
            month = 11;
            --year;
        }
        else {
            --month;
        }
        return new AlmanacDay(year, month, Utils.last_day(year, month));
    };
    
    AlmanacDay.prototype.next_month = function() {
        var month = this.month, year = this.year;
        if(month == 1) {
            month = 0;
            ++year;
        }
        else {
            ++month;
        }
        return new AlmanacDay(year, month, 1);
    };
    
    AlmanacDay.prototype.toISOString = function() {
        return this.year + '-' + Utils.pad(this.month  + 1) + '-' + Utils.pad(this.day);
    };
    
    var almanac_range = function(value) {
        var dt     = value || new Date();
        var today  = new AlmanacDay(dt.getFullYear(), dt.getMonth(), dt.getDate(), true);
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
    
    var create_days = function(dt, opts) {
        var cdt, week_el, day_el;
        var month_el = DOM.create(opts.month_tag, {'className': opts.month_class});
        var cal = almanac_range(dt);
        for(var i = 0; i < cal.length; i++) {
            cdt = cal[i];
            if(i % 7 == 0) {
                week_el = DOM.create(opts.week_tag, {'className': opts.week_class})
                month_el.appendChild(week_el);
            }
            day_el = DOM.create(opts.day_tag, {'className': opts.day_class});
            if(!cdt.is_current) {
                day_el.className += ' other';
            }
            
            if(opts.day_onclick) {
                if(Utils.is_string(opts.day_onclick)) {
                    day_el.addEventListener('click', function() {
                        document.getElementById(opts.day_onclick).value = this.dataset['date'];
                    }, false);
                }
                else {
                    day_el.addEventListener('click', opts.day_onclick, false);
                }
            }
            
            day_el.appendChild(DOM.create(opts.day_num_tag, {'className': opts.day_num_class,'textContent': cdt.day}));
            day_el.dataset['date'] = cdt.toISOString();
            week_el.appendChild(day_el);
            
            if(opts.day_post_create) {
                opts.day_post_create(day_el, cdt)
            }
        }
        return month_el;
    };
    
    root.Almanac = {
        create: function(el, opts) {
            var dt = opts.date || new Date();
            opts = Utils.merge(DEFAULT_OPTS, opts || {});

            el.appendChild(date_select(dt, opts));
            el.appendChild(weekday_header(opts));
            el.appendChild(create_days(dt, opts));
        },
        range: almanac_range,
        Day: AlmanacDay,
        Utils: Utils
    };
}(this));

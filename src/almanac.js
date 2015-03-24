/* @preserve Version 0.1, Copyright (c) 2015 David A Krauth */
;Almanac = (function(root) {
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
        create: function(tag, opts, children) {
            var i = 0;
            var el = document.createElement(tag);
            for(var key in opts) {
                if(opts.hasOwnProperty(key)) {
                    el[key] = opts[key];
                }
            }
            if(children) {
                while(i < children.length) {
                    el.appendChild(children[i++])
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
        iso_string: function(dt) {
            return dt.getFullYear() + '-' + Utils.pad(dt.getMonth() + 1) + '-' + Utils.pad(dt.getDate());
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

    var create_weekday_header_elements = function(opts) {
        var el = DOM.create(opts.weekday_wrapper_tag, {className: opts.weekday_wrapper_class});
        opts.days_of_week.forEach(function(name) {
            el.appendChild(DOM.create(opts.weekday_tag, {'textContent': name}));
        });
        return el;
    };

    var make_selector_change_handler = function(opts) {
        return function() {
            var month_sel = this.parentElement.querySelector('select[data-type="month"]');
            var year_sel = this.parentElement.querySelector('select[data-type="year"]');
            var container = this.parentElement.parentElement;
            var month_el = container.querySelector('.' + opts.month_class);
        
            var month = parseInt(month_sel.value);
            var year =  parseInt(year_sel.value);
            var dt = new Date(year, month);
            container.replaceChild(create_days_elements(dt, opts), month_el);
        };
    };
    
    var make_month_selector = function(mo, opts) {
        var el = DOM.create('select', {'className': opts.selector_month_class});
        el.dataset['type'] = 'month';
        el.addEventListener('change', make_selector_change_handler(opts), false);
        opts.month_names.forEach(function(name, i) {
            el.appendChild(DOM.option(name, i));
            if(i == mo) {
                el.selectedIndex = i;
            }
        });
        return el;
    };
    
    var make_year_selector = function(year, opts) {
        var i = 0;
        var el = DOM.create('select', {'className': opts.selector_year_class});
        var year_range = opts.year_range;
        el.dataset['type'] = 'year';
        el.addEventListener('change', make_selector_change_handler(opts), false);
        
        if(Utils.is_string(year_range)) {
            year_range = parse_year_range(year_range, year);
        }
        
        for(; i < year_range.length; i++) {
            el.appendChild(DOM.option(year_range[i], year_range[i]));
            if(year_range[i] == year) {
                el.selectedIndex = i;
            }
        }
        return el;
    };
    
    var create_date_selectors_elements = function(dt, opts) {
        var el = DOM.create(opts.selector_tag, {'className': opts.selector_class});
        el.appendChild(make_month_selector(dt.getMonth(), opts));
        el.appendChild(make_year_selector(dt.getFullYear(), opts));
        return el;
    };

    var AlmanacDay = function(year, month, day, is_current) {
        this.date = new Date(year, month, day);
        this.day_of_week = this.date.getDay();
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
    
    var create_day_element = function(cdt, opts) {
        var el = DOM.create(opts.day_tag, {'className': opts.day_class});
        if(!cdt.is_current) {
            el.className += ' other';
        }
        
        if(opts.day_onclick) {
            if(Utils.is_string(opts.day_onclick)) {
                el.addEventListener('click', function() {
                    document.getElementById(opts.day_onclick).value = this.dataset['date'];
                }, false);
            }
            else {
                el.addEventListener('click', opts.day_onclick, false);
            }
        }
        
        el.appendChild(DOM.create(opts.day_num_tag, {'className': opts.day_num_class,'textContent': cdt.day}));
        el.dataset['date'] = cdt.toISOString();
        if(opts.day_post_create) {
            opts.day_post_create(el, cdt)
        }
        
        return el;
    };
    
    var create_days_elements = function(dt, opts) {
        var cdt, week_el;
        var month_el = DOM.create(opts.month_tag, {'className': opts.month_class});
        var cal = almanac_range(dt);
        for(var i = 0; i < cal.length; i++) {
            cdt = cal[i];
            if(i % 7 == 0) {
                week_el = DOM.create(opts.week_tag, {'className': opts.week_class})
                month_el.appendChild(week_el);
            }
            
            week_el.appendChild(create_day_element(cdt, opts));
        }
        return month_el;
    };
    
    var initialize = function(el, opts) {
        var dt = opts.date || new Date();
        opts = Utils.merge(DEFAULT_OPTS, opts || {});

        el.appendChild(create_date_selectors_elements(dt, opts));
        el.appendChild(create_weekday_header_elements(opts));
        el.appendChild(create_days_elements(dt, opts));
    };
    
    return {
        initialize: initialize,
        range: almanac_range,
        Day: AlmanacDay,
        Utils: Utils
    };
}());

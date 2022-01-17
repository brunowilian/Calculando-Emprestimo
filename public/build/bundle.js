
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\componetes\Sobre.svelte generated by Svelte v3.44.2 */

    const file$2 = "src\\componetes\\Sobre.svelte";

    function create_fragment$2(ctx) {
    	let body;
    	let main;
    	let h1;
    	let t1;
    	let p;
    	let t2;
    	let br;
    	let t3;
    	let t4;
    	let h3;
    	let t6;
    	let table;
    	let tr0;
    	let th0;
    	let t8;
    	let th1;
    	let t10;
    	let th2;
    	let t12;
    	let th3;
    	let t14;
    	let th4;
    	let t16;
    	let tr1;
    	let td0;
    	let t18;
    	let td1;
    	let t20;
    	let td2;
    	let t22;
    	let td3;
    	let t24;
    	let td4;
    	let t26;
    	let tr2;
    	let td5;
    	let t28;
    	let td6;
    	let t30;
    	let td7;
    	let t32;
    	let td8;
    	let t34;
    	let td9;
    	let t36;
    	let tr3;
    	let td10;
    	let t38;
    	let td11;
    	let t40;
    	let td12;
    	let t42;
    	let td13;
    	let t44;
    	let td14;

    	const block = {
    		c: function create() {
    			body = element("body");
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Sobre";
    			t1 = space();
    			p = element("p");
    			t2 = text("Sistema desenvolvido para calculo de emprestimo bancario.\r\n    ");
    			br = element("br");
    			t3 = text("\r\n    Bancos do Brasil / Banco Caixa Econômica / Banco Itaú");
    			t4 = space();
    			h3 = element("h3");
    			h3.textContent = "Juros de cada Banco:";
    			t6 = space();
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Banco";
    			t8 = space();
    			th1 = element("th");
    			th1.textContent = "juros a.m";
    			t10 = space();
    			th2 = element("th");
    			th2.textContent = "Consignado";
    			t12 = space();
    			th3 = element("th");
    			th3.textContent = "Correntista";
    			t14 = space();
    			th4 = element("th");
    			th4.textContent = "Consignado e Correntista";
    			t16 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Brasil";
    			t18 = space();
    			td1 = element("td");
    			td1.textContent = "3.06";
    			t20 = space();
    			td2 = element("td");
    			td2.textContent = "2.96";
    			t22 = space();
    			td3 = element("td");
    			td3.textContent = "2.72";
    			t24 = space();
    			td4 = element("td");
    			td4.textContent = "2.52";
    			t26 = space();
    			tr2 = element("tr");
    			td5 = element("td");
    			td5.textContent = "Caixa Econômica";
    			t28 = space();
    			td6 = element("td");
    			td6.textContent = "3.32";
    			t30 = space();
    			td7 = element("td");
    			td7.textContent = "3.22";
    			t32 = space();
    			td8 = element("td");
    			td8.textContent = "3.12";
    			t34 = space();
    			td9 = element("td");
    			td9.textContent = "3.01";
    			t36 = space();
    			tr3 = element("tr");
    			td10 = element("td");
    			td10.textContent = "Itaú";
    			t38 = space();
    			td11 = element("td");
    			td11.textContent = "3.72";
    			t40 = space();
    			td12 = element("td");
    			td12.textContent = "3.63";
    			t42 = space();
    			td13 = element("td");
    			td13.textContent = "3.56";
    			t44 = space();
    			td14 = element("td");
    			td14.textContent = "3.42";
    			attr_dev(h1, "class", "svelte-l2zh7b");
    			add_location(h1, file$2, 2, 2, 18);
    			add_location(br, file$2, 4, 4, 102);
    			attr_dev(p, "class", "svelte-l2zh7b");
    			add_location(p, file$2, 3, 2, 36);
    			add_location(h3, file$2, 7, 2, 177);
    			attr_dev(th0, "class", "svelte-l2zh7b");
    			add_location(th0, file$2, 10, 6, 235);
    			attr_dev(th1, "class", "svelte-l2zh7b");
    			add_location(th1, file$2, 11, 6, 257);
    			attr_dev(th2, "class", "svelte-l2zh7b");
    			add_location(th2, file$2, 12, 6, 283);
    			attr_dev(th3, "class", "svelte-l2zh7b");
    			add_location(th3, file$2, 13, 6, 310);
    			attr_dev(th4, "class", "svelte-l2zh7b");
    			add_location(th4, file$2, 14, 6, 338);
    			attr_dev(tr0, "class", "svelte-l2zh7b");
    			add_location(tr0, file$2, 9, 4, 223);
    			attr_dev(td0, "class", "svelte-l2zh7b");
    			add_location(td0, file$2, 17, 5, 399);
    			attr_dev(td1, "class", "svelte-l2zh7b");
    			add_location(td1, file$2, 18, 5, 421);
    			attr_dev(td2, "class", "svelte-l2zh7b");
    			add_location(td2, file$2, 19, 5, 441);
    			attr_dev(td3, "class", "svelte-l2zh7b");
    			add_location(td3, file$2, 20, 5, 461);
    			attr_dev(td4, "class", "svelte-l2zh7b");
    			add_location(td4, file$2, 21, 5, 481);
    			attr_dev(tr1, "class", "svelte-l2zh7b");
    			add_location(tr1, file$2, 16, 4, 388);
    			attr_dev(td5, "class", "svelte-l2zh7b");
    			add_location(td5, file$2, 24, 6, 523);
    			attr_dev(td6, "class", "svelte-l2zh7b");
    			add_location(td6, file$2, 25, 6, 555);
    			attr_dev(td7, "class", "svelte-l2zh7b");
    			add_location(td7, file$2, 26, 6, 576);
    			attr_dev(td8, "class", "svelte-l2zh7b");
    			add_location(td8, file$2, 27, 6, 597);
    			attr_dev(td9, "class", "svelte-l2zh7b");
    			add_location(td9, file$2, 28, 6, 618);
    			attr_dev(tr2, "class", "svelte-l2zh7b");
    			add_location(tr2, file$2, 23, 4, 511);
    			attr_dev(td10, "class", "svelte-l2zh7b");
    			add_location(td10, file$2, 31, 6, 662);
    			attr_dev(td11, "class", "svelte-l2zh7b");
    			add_location(td11, file$2, 32, 6, 683);
    			attr_dev(td12, "class", "svelte-l2zh7b");
    			add_location(td12, file$2, 33, 6, 704);
    			attr_dev(td13, "class", "svelte-l2zh7b");
    			add_location(td13, file$2, 34, 6, 725);
    			attr_dev(td14, "class", "svelte-l2zh7b");
    			add_location(td14, file$2, 35, 6, 746);
    			attr_dev(tr3, "class", "svelte-l2zh7b");
    			add_location(tr3, file$2, 30, 5, 650);
    			attr_dev(table, "class", "svelte-l2zh7b");
    			add_location(table, file$2, 8, 2, 210);
    			add_location(main, file$2, 1, 0, 8);
    			add_location(body, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, main);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p);
    			append_dev(p, t2);
    			append_dev(p, br);
    			append_dev(p, t3);
    			append_dev(main, t4);
    			append_dev(main, h3);
    			append_dev(main, t6);
    			append_dev(main, table);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t8);
    			append_dev(tr0, th1);
    			append_dev(tr0, t10);
    			append_dev(tr0, th2);
    			append_dev(tr0, t12);
    			append_dev(tr0, th3);
    			append_dev(tr0, t14);
    			append_dev(tr0, th4);
    			append_dev(table, t16);
    			append_dev(table, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t18);
    			append_dev(tr1, td1);
    			append_dev(tr1, t20);
    			append_dev(tr1, td2);
    			append_dev(tr1, t22);
    			append_dev(tr1, td3);
    			append_dev(tr1, t24);
    			append_dev(tr1, td4);
    			append_dev(table, t26);
    			append_dev(table, tr2);
    			append_dev(tr2, td5);
    			append_dev(tr2, t28);
    			append_dev(tr2, td6);
    			append_dev(tr2, t30);
    			append_dev(tr2, td7);
    			append_dev(tr2, t32);
    			append_dev(tr2, td8);
    			append_dev(tr2, t34);
    			append_dev(tr2, td9);
    			append_dev(table, t36);
    			append_dev(table, tr3);
    			append_dev(tr3, td10);
    			append_dev(tr3, t38);
    			append_dev(tr3, td11);
    			append_dev(tr3, t40);
    			append_dev(tr3, td12);
    			append_dev(tr3, t42);
    			append_dev(tr3, td13);
    			append_dev(tr3, t44);
    			append_dev(tr3, td14);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sobre', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sobre> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Sobre extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sobre",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\componetes\Emprestimo.svelte generated by Svelte v3.44.2 */

    const file$1 = "src\\componetes\\Emprestimo.svelte";

    function create_fragment$1(ctx) {
    	let body;
    	let main;
    	let div0;
    	let h1;
    	let t1;
    	let div6;
    	let form0;
    	let div1;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div2;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div5;
    	let form1;
    	let label2;
    	let t9;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let t13;
    	let div3;
    	let form2;
    	let label3;
    	let t15;
    	let select1;
    	let option3;
    	let option4;
    	let t18;
    	let div4;
    	let form3;
    	let label4;
    	let t20;
    	let select2;
    	let option5;
    	let option6;
    	let t23;
    	let div7;
    	let button;
    	let t25;
    	let div9;
    	let p0;
    	let t26;
    	let t27;
    	let t28;
    	let div8;
    	let p1;
    	let t29;
    	let t30;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			body = element("body");
    			main = element("main");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Emprestimo Bancario";
    			t1 = space();
    			div6 = element("div");
    			form0 = element("form");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Qual é o valor do emprestimo :";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Informe em quantos meses é o finaciamento :";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div5 = element("div");
    			form1 = element("form");
    			label2 = element("label");
    			label2.textContent = "Escolhar um banco :";
    			t9 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Banco do Brasil";
    			option1 = element("option");
    			option1.textContent = "Banco da Caixa";
    			option2 = element("option");
    			option2.textContent = "Banco Itaú";
    			t13 = space();
    			div3 = element("div");
    			form2 = element("form");
    			label3 = element("label");
    			label3.textContent = "O emprestimo é consignado ?";
    			t15 = space();
    			select1 = element("select");
    			option3 = element("option");
    			option3.textContent = "Sim";
    			option4 = element("option");
    			option4.textContent = "Não";
    			t18 = space();
    			div4 = element("div");
    			form3 = element("form");
    			label4 = element("label");
    			label4.textContent = "Você é correntista do banco ?";
    			t20 = space();
    			select2 = element("select");
    			option5 = element("option");
    			option5.textContent = "Sim";
    			option6 = element("option");
    			option6.textContent = "Não";
    			t23 = space();
    			div7 = element("div");
    			button = element("button");
    			button.textContent = "Calcular";
    			t25 = space();
    			div9 = element("div");
    			p0 = element("p");
    			t26 = text("O valor a ser pago por mes é : ");
    			t27 = text(/*valormess*/ ctx[1]);
    			t28 = space();
    			div8 = element("div");
    			p1 = element("p");
    			t29 = text("O valor total é : ");
    			t30 = text(/*valortotall*/ ctx[0]);
    			attr_dev(h1, "class", "svelte-us6y1i");
    			add_location(h1, file$1, 108, 6, 3026);
    			add_location(div0, file$1, 107, 4, 3013);
    			attr_dev(label0, "for", "valor");
    			add_location(label0, file$1, 113, 12, 3157);
    			attr_dev(input0, "class", "valor svelte-us6y1i");
    			attr_dev(input0, "type", "number");
    			add_location(input0, file$1, 114, 12, 3228);
    			attr_dev(div1, "class", "emprestimoo svelte-us6y1i");
    			add_location(div1, file$1, 112, 10, 3118);
    			attr_dev(label1, "for", "mes");
    			add_location(label1, file$1, 117, 12, 3351);
    			attr_dev(input1, "class", "mes svelte-us6y1i");
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$1, 118, 12, 3433);
    			attr_dev(div2, "class", "emprestimoo svelte-us6y1i");
    			add_location(div2, file$1, 116, 10, 3312);
    			attr_dev(form0, "action", "/");
    			add_location(form0, file$1, 111, 8, 3089);
    			attr_dev(label2, "for", "banco");
    			add_location(label2, file$1, 123, 12, 3596);
    			option0.__value = "brasil";
    			option0.value = option0.__value;
    			add_location(option0, file$1, 125, 14, 3711);
    			option1.__value = "caixa";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 126, 14, 3774);
    			option2.__value = "itau";
    			option2.value = option2.__value;
    			add_location(option2, file$1, 127, 14, 3835);
    			attr_dev(select0, "id", "banco");
    			if (/*banco*/ ctx[4] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[10].call(select0));
    			add_location(select0, file$1, 124, 12, 3656);
    			attr_dev(form1, "action", "/");
    			add_location(form1, file$1, 122, 10, 3565);
    			attr_dev(label3, "for", "consignado");
    			add_location(label3, file$1, 132, 14, 4001);
    			option3.__value = "Sim";
    			option3.value = option3.__value;
    			add_location(option3, file$1, 134, 16, 4161);
    			option4.__value = "Nao";
    			option4.value = option4.__value;
    			add_location(option4, file$1, 135, 16, 4211);
    			attr_dev(select1, "name", "consignado");
    			attr_dev(select1, "id", "consignado");
    			if (/*consignado*/ ctx[5] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[11].call(select1));
    			add_location(select1, file$1, 133, 14, 4076);
    			attr_dev(form2, "action", "/");
    			add_location(form2, file$1, 131, 12, 3968);
    			attr_dev(div3, "class", "emprestimoo svelte-us6y1i");
    			add_location(div3, file$1, 130, 10, 3929);
    			attr_dev(label4, "for", "correntista");
    			add_location(label4, file$1, 141, 14, 4391);
    			option5.__value = "Sim";
    			option5.value = option5.__value;
    			add_location(option5, file$1, 143, 16, 4557);
    			option6.__value = "Nao";
    			option6.value = option6.__value;
    			add_location(option6, file$1, 144, 16, 4607);
    			attr_dev(select2, "name", "correntista");
    			attr_dev(select2, "id", "correntista");
    			if (/*correntista*/ ctx[6] === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[12].call(select2));
    			add_location(select2, file$1, 142, 14, 4469);
    			attr_dev(form3, "action", "/");
    			add_location(form3, file$1, 140, 12, 4358);
    			attr_dev(div4, "class", "emprestimoo svelte-us6y1i");
    			add_location(div4, file$1, 139, 10, 4319);
    			attr_dev(div5, "class", "emprestimoo svelte-us6y1i");
    			add_location(div5, file$1, 121, 8, 3528);
    			add_location(div6, file$1, 110, 6, 3074);
    			attr_dev(button, "class", "svelte-us6y1i");
    			add_location(button, file$1, 151, 6, 4767);
    			attr_dev(div7, "class", "button svelte-us6y1i");
    			add_location(div7, file$1, 150, 4, 4739);
    			attr_dev(p0, "class", "valor svelte-us6y1i");
    			add_location(p0, file$1, 154, 6, 4844);
    			attr_dev(p1, "class", "valor svelte-us6y1i");
    			add_location(p1, file$1, 156, 8, 4931);
    			add_location(div8, file$1, 155, 6, 4916);
    			add_location(div9, file$1, 153, 4, 4831);
    			attr_dev(main, "class", "principal svelte-us6y1i");
    			add_location(main, file$1, 106, 2, 2983);
    			add_location(body, file$1, 105, 0, 2973);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, main);
    			append_dev(main, div0);
    			append_dev(div0, h1);
    			append_dev(main, t1);
    			append_dev(main, div6);
    			append_dev(div6, form0);
    			append_dev(form0, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			set_input_value(input0, /*valor*/ ctx[2]);
    			append_dev(form0, t4);
    			append_dev(form0, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t6);
    			append_dev(div2, input1);
    			set_input_value(input1, /*mes*/ ctx[3]);
    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div5, form1);
    			append_dev(form1, label2);
    			append_dev(form1, t9);
    			append_dev(form1, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			select_option(select0, /*banco*/ ctx[4]);
    			append_dev(div5, t13);
    			append_dev(div5, div3);
    			append_dev(div3, form2);
    			append_dev(form2, label3);
    			append_dev(form2, t15);
    			append_dev(form2, select1);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			select_option(select1, /*consignado*/ ctx[5]);
    			append_dev(div5, t18);
    			append_dev(div5, div4);
    			append_dev(div4, form3);
    			append_dev(form3, label4);
    			append_dev(form3, t20);
    			append_dev(form3, select2);
    			append_dev(select2, option5);
    			append_dev(select2, option6);
    			select_option(select2, /*correntista*/ ctx[6]);
    			append_dev(main, t23);
    			append_dev(main, div7);
    			append_dev(div7, button);
    			append_dev(main, t25);
    			append_dev(main, div9);
    			append_dev(div9, p0);
    			append_dev(p0, t26);
    			append_dev(p0, t27);
    			append_dev(div9, t28);
    			append_dev(div9, div8);
    			append_dev(div8, p1);
    			append_dev(p1, t29);
    			append_dev(p1, t30);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[10]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[11]),
    					listen_dev(select2, "change", /*select2_change_handler*/ ctx[12]),
    					listen_dev(button, "click", /*verificar*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*valor*/ 4 && to_number(input0.value) !== /*valor*/ ctx[2]) {
    				set_input_value(input0, /*valor*/ ctx[2]);
    			}

    			if (dirty & /*mes*/ 8 && to_number(input1.value) !== /*mes*/ ctx[3]) {
    				set_input_value(input1, /*mes*/ ctx[3]);
    			}

    			if (dirty & /*banco*/ 16) {
    				select_option(select0, /*banco*/ ctx[4]);
    			}

    			if (dirty & /*consignado*/ 32) {
    				select_option(select1, /*consignado*/ ctx[5]);
    			}

    			if (dirty & /*correntista*/ 64) {
    				select_option(select2, /*correntista*/ ctx[6]);
    			}

    			if (dirty & /*valormess*/ 2) set_data_dev(t27, /*valormess*/ ctx[1]);
    			if (dirty & /*valortotall*/ 1) set_data_dev(t30, /*valortotall*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Emprestimo', slots, []);
    	let valortotall = 0;
    	let valormess = 0;
    	let valor = null;
    	let mes = null;
    	let banco = "";
    	let consignado = "";
    	let correntista = "";

    	class Bancos {
    		constructor(banco, juros) {
    			this.banco = banco;
    			this.juros = juros;
    		}
    	}

    	const BancoBrasil = new Bancos("Brasil", [3.06, 2.96, 2.72, 2.52]);
    	const BancoCaixa = new Bancos("Caixa", [3.32, 3.22, 3.12, 3.01]);
    	const BancoItau = new Bancos("Itau", [3.72, 3.63, 3.56, 3.42]);
    	let valortotal = 0;
    	let juros = 0;
    	let valormes = 0;

    	function verificar() {
    		if (banco == "brasil" && consignado == "Nao" && correntista == "Nao") {
    			juros = valor * BancoBrasil.juros[0] / 100 * mes;
    			calculo();
    		} else if (banco == "brasil" && consignado == "Sim" && correntista == "Nao") {
    			juros = valor * BancoBrasil.juros[1] / 100 * mes;
    			calculo();
    		} else if (banco == "brasil" && consignado == "Nao" && correntista == "Sim") {
    			juros = valor * BancoBrasil.juros[2] / 100 * mes;
    			calculo();
    		} else if (banco == "brasil" && consignado == "Sim" && correntista == "Sim") {
    			juros = valor * BancoBrasil.juros[3] / 100 * mes;
    			calculo();
    		} // banco caixa

    		if (banco == "caixa" && consignado == "Nao" && correntista == "Nao") {
    			juros = valor * BancoCaixa.juros[0] / 100 * mes;
    			calculo();
    		} else if (banco == "caixa" && consignado == "Sim" && correntista == "Nao") {
    			juros = valor * BancoCaixa.juros[1] / 100 * mes;
    			calculo();
    		} else if (banco == "caixa" && consignado == "Nao" && correntista == "Sim") {
    			juros = valor * BancoCaixa.juros[2] / 100 * mes;
    			calculo();
    		} else if (banco == "caixa" && consignado == "Sim" && correntista == "Sim") {
    			juros = valor * BancoCaixa.juros[3] / 100 * mes;
    			calculo();
    		}

    		// banco Itau
    		if (banco == "itau" && consignado == "Nao" && correntista == "Nao") {
    			juros = valor * BancoItau.juros[0] / 100 * mes;
    			calculo();
    		} else if (banco == "itau" && consignado == "Sim" && correntista == "Nao") {
    			juros = valor * BancoItau.juros[1] / 100 * mes;
    			calculo();
    		} else if (banco == "itau" && consignado == "Nao" && correntista == "Sim") {
    			juros = +(valor * BancoItau.juros[2] / 100 * mes);
    			calculo();
    		} else if (banco == "itau" && consignado == "Sim" && correntista == "Sim") {
    			juros = valor * BancoItau.juros[3] / 100 * mes;
    			calculo();
    		}

    		validar_campo();
    	}

    	function validar_campo() {
    		if (valor == null) {
    			alert("Infomar valor do emprestimo.");
    		} else if (mes == null) {
    			alert("Informar a quantidade de meses.");
    		}
    	}

    	function calculo() {
    		valortotal = valor + juros;
    		valormes = valortotal / mes;
    		$$invalidate(0, valortotall = valortotal.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }));
    		$$invalidate(1, valormess = valormes.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Emprestimo> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		valor = to_number(this.value);
    		$$invalidate(2, valor);
    	}

    	function input1_input_handler() {
    		mes = to_number(this.value);
    		$$invalidate(3, mes);
    	}

    	function select0_change_handler() {
    		banco = select_value(this);
    		$$invalidate(4, banco);
    	}

    	function select1_change_handler() {
    		consignado = select_value(this);
    		$$invalidate(5, consignado);
    	}

    	function select2_change_handler() {
    		correntista = select_value(this);
    		$$invalidate(6, correntista);
    	}

    	$$self.$capture_state = () => ({
    		valortotall,
    		valormess,
    		valor,
    		mes,
    		banco,
    		consignado,
    		correntista,
    		Bancos,
    		BancoBrasil,
    		BancoCaixa,
    		BancoItau,
    		valortotal,
    		juros,
    		valormes,
    		verificar,
    		validar_campo,
    		calculo
    	});

    	$$self.$inject_state = $$props => {
    		if ('valortotall' in $$props) $$invalidate(0, valortotall = $$props.valortotall);
    		if ('valormess' in $$props) $$invalidate(1, valormess = $$props.valormess);
    		if ('valor' in $$props) $$invalidate(2, valor = $$props.valor);
    		if ('mes' in $$props) $$invalidate(3, mes = $$props.mes);
    		if ('banco' in $$props) $$invalidate(4, banco = $$props.banco);
    		if ('consignado' in $$props) $$invalidate(5, consignado = $$props.consignado);
    		if ('correntista' in $$props) $$invalidate(6, correntista = $$props.correntista);
    		if ('valortotal' in $$props) valortotal = $$props.valortotal;
    		if ('juros' in $$props) juros = $$props.juros;
    		if ('valormes' in $$props) valormes = $$props.valormes;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		valortotall,
    		valormess,
    		valor,
    		mes,
    		banco,
    		consignado,
    		correntista,
    		verificar,
    		input0_input_handler,
    		input1_input_handler,
    		select0_change_handler,
    		select1_change_handler,
    		select2_change_handler
    	];
    }

    class Emprestimo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Emprestimo",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.2 */
    const file = "src\\App.svelte";

    // (19:22) 
    function create_if_block_1(ctx) {
    	let sobre;
    	let current;
    	sobre = new Sobre({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(sobre.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sobre, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sobre.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sobre.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sobre, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(19:22) ",
    		ctx
    	});

    	return block;
    }

    // (17:1) {#if menu === 0}
    function create_if_block(ctx) {
    	let emprestimo;
    	let current;
    	emprestimo = new Emprestimo({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(emprestimo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(emprestimo, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(emprestimo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(emprestimo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(emprestimo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(17:1) {#if menu === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let ul;
    	let li0;
    	let a0;
    	let t1;
    	let li1;
    	let a1;
    	let t3;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*menu*/ ctx[0] === 0) return 0;
    		if (/*menu*/ ctx[0] === 1) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Hoje";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Sobre";
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(a0, "href", "/");
    			add_location(a0, file, 9, 2, 180);
    			attr_dev(li0, "class", "menuu");
    			add_location(li0, file, 8, 1, 159);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file, 12, 2, 273);
    			attr_dev(li1, "class", "menuu");
    			add_location(li1, file, 11, 1, 252);
    			attr_dev(ul, "id", "menu");
    			attr_dev(ul, "class", "svelte-p4cos");
    			add_location(ul, file, 7, 0, 143);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			insert_dev(target, t3, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", prevent_default(/*click_handler*/ ctx[1]), false, true, false),
    					listen_dev(a1, "click", prevent_default(/*click_handler_1*/ ctx[2]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (detaching) detach_dev(t3);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let menu = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, menu = 0);
    	const click_handler_1 = () => $$invalidate(0, menu = 1);
    	$$self.$capture_state = () => ({ Sobre, Emprestimo, menu });

    	$$self.$inject_state = $$props => {
    		if ('menu' in $$props) $$invalidate(0, menu = $$props.menu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [menu, click_handler, click_handler_1];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map

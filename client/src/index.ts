import axios from 'axios';

// Global
let root = document.documentElement
let theme_icon = query('#theme img') as HTMLImageElement
let theme_toggle = query('#theme') as HTMLAnchorElement

// User input
let textarea = query('#user_input textarea') as HTMLTextAreaElement
let char_count = query('#char_count') as HTMLSpanElement

// Feedback section
let feedback_id: number;
let feedback_prompt = query('#feedback h1') as HTMLElement
let feedback_section = query('#feedback') as HTMLElement

// feedback[:2] - reset[2]
let buttons = query('button', true) as NodeListOf<HTMLButtonElement>

// Abort signal
let abort: AbortController | undefined;

// Request state
let req: boolean = false;

// Theme toggle listener
theme_toggle.addEventListener('click', toggle_theme)

textarea.addEventListener('input', handle_input)
// Trigger input event for height fix
textarea.dispatchEvent(new Event('input'))

// Submit listener
textarea.addEventListener('keypress', submit)
for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', i != 2 ? send_feedback.bind(this, i == 0 ? 1 : 0) : handle_reset)
}

function query(query: string, all: boolean = false) {
    return all ? document.querySelectorAll(query)! : document.querySelector(query)!
}

function toggle_theme() {
    const dark = root.style.backgroundColor !== 'white'

    theme_icon.src = dark ? 'dark-theme.svg' : 'light-theme.svg';
    theme_icon.alt = dark ? 'Dark theme' : 'Light theme';

    root.style.color = dark ? 'Black' : 'rgba(54, 54, 54, 0.87)';
    root.style.backgroundColor = dark ? 'white' : 'Black';
}

function handle_input() {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';

    char_count.innerText = textarea.value.length.toString();
    char_count.style.color = textarea.value.length < 10 ? 'red' : 'green';
}

async function submit(e: KeyboardEvent) {
    if (e.key !== 'Enter' || req) return
    req = true
    e.preventDefault();
    e.stopPropagation();

    feedback_section.hidden = false
    textarea.disabled = true

    let message: string;
    let err = false;

    await axios.get('/api', { params: { prompt: textarea.value } })
        .then(res => {
            message = res.data.response
            feedback_id = res.data.id
        })
        .catch(() => {
            message = 'Seems to have been an error. Please try again.'
            err = true
        })

    await remove_text.call(textarea, 76)

    await add_text.call(textarea, message!, 76)

    await useless_delay(400)

    if (!err) {

        await add_text.call(feedback_prompt, 'Did we get it right?', 74)

        for (let i = 0; i < 2; i++) hide_enable.call(buttons[i]);

        await useless_delay(400);
    }

    hide_enable.call(buttons[2])

    document.addEventListener('keypress', enter_reset)
}

async function send_feedback(success: number) {
    axios.post('/feedback', { id: feedback_id, success })

    for (let i = 0; i < 2; i++) {
        hide_enable.call(buttons[i])
    }

    abort = new AbortController();

    await remove_text.call(feedback_prompt, 70, abort)

    await add_text.call(feedback_prompt, 'Thank you for the feedback!', 60, abort)
}

function enter_reset(e: KeyboardEvent) {
    if (e.key !== 'Enter') return
    e.preventDefault();

    handle_reset()
}

function handle_reset() {
    // Abort any text being printed
    abort?.abort();

    // Hide buttons
    let range = [2]
    if (!buttons[0].disabled) range.push(0, 1)
    for (const i of range) {
        hide_enable.call(buttons[i])
    }

    // Remove feedback prompt
    feedback_prompt.innerText = ""

    // Remove reset with enter key listener
    document.removeEventListener('keypress', enter_reset)

    // Reset textarea
    textarea.value = ""
    textarea.dispatchEvent(new Event('input'));
    textarea.disabled = false;
    req = false

    // Hide elements
    hide_enable.call(feedback_section);

    window.scrollTo(0, 0);
    textarea.focus();
}

async function useless_delay(time: number) {
    return await new Promise((resolve) => {
        setTimeout(() => {
            resolve(void 0)
        }, time)
    })
}

interface has_value extends HTMLElement {
    value?: string
}

async function add_text(this: has_value, text: string, time: number, abort?: AbortController) {
    const property = this.value !== undefined;

    for (let i = 0; i < text.length; i++) {
        if (abort?.signal.aborted) return this.value ? this.value = "" : this.innerText = "";
        await new Promise((resolve) => {
            setTimeout(() => {
                if (property) resolve(this.value += text[i])
                else resolve(this.insertAdjacentText('beforeend', text[i]))
            }, time)
        })
    }
}

async function remove_text(this: has_value, time: number, abort?: AbortController) {
    let value = this.value !== undefined;

    let property: 'value' | 'innerText' = value ? 'value' : 'innerText';
    let current = value ? this.value : this.innerText;

    if (!current) return

    for (let i = 0; i < current.length; i++) {
        if (abort?.signal.aborted) return this[property] = ""
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(this[property] = current!.slice(0, current!.length - (i + 1)))
            }, time);
        })
    }
}

interface enabable_element extends HTMLElement {
    disabled?: boolean
}

function hide_enable(this: enabable_element) {
    this.hidden = !this.hidden
    if (this.disabled != undefined) this.disabled = this.hidden
}

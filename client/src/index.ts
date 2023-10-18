import axios from 'axios';

class dom_elements {
    protected element = (query: string) => document.querySelector(query);

    // Initial Elements
    protected input: HTMLTextAreaElement = this.element('textarea')! as HTMLTextAreaElement;
    protected char_count: HTMLSpanElement = this.element('span')! as HTMLSpanElement;

    constructor() {
        this.input.addEventListener('input', this.handle_input)
    }

    handle_input() {
        const len = this.input.value.length;

        // Set counter
        this.char_count.innerText = len.toString();

        // Set counter color
        if (len >= 10) this.char_count.style.color = "green";
        if (len < 10) this.char_count.style.color = "red"

        // Set height
        this.input.style.height = "auto";
        this.input.style.height = (this.input.scrollHeight) + "px";
    }
    
    protected async remove_displayed_message(this: HTMLElement, time: number) {
        for (let i = 0; i < this.innerText.length; i++) {
            await new Promise((resolve)=> {
                setTimeout(()=> {
                    resolve(this.innerText = this.innerText.slice(0, -1))
                }, time)
            })
        }
    }

    protected async display_message(this: HTMLElement, message: any, time: number) {
        for (const char of message) {
            await new Promise((resolve)=> {
                setTimeout(()=> {
                    resolve(this.insertAdjacentText('beforeend', char))
                }, time)
            })
        }
    }

    protected async useless_delay(time: number) {
        return new Promise((resolve)=> {
            setTimeout(()=> {
                resolve(void 0)
            }, time)
        })
    }
}

class nametoit extends dom_elements {
    // Global response section
    private response_section: HTMLElement = this.element('#result')! as HTMLElement;

    // Result
    private result_id?: number;
    private result: HTMLElement = this.element('#result h1')! as HTMLElement;
    
    // Feedback
    private feedback_prompt = this.element('div.feedback h1')! as HTMLElement;
    
    // Buttons (feedback[:2] - reset[2])
    private buttons = document.querySelectorAll('.result_buttons')! as NodeListOf<HTMLButtonElement>;

    constructor() {
        super();
        this.input.addEventListener('keypress', async (e)=> await this.submit.call(this, e))
        this.buttons[2].addEventListener('click', this.reset)
        for (let i = 0; i < 2; i++) {
            this.buttons[i].addEventListener('click', this.feedback.bind(this, i === 0))
        }
    }

    async submit(e: KeyboardEvent) {
        if (e.key !== 'Enter') return
        this.input.disabled = true;
        this.response_section.hidden = false;

        try {
            const response = await axios.get('http://localhost:8000/api', { params: { prompt: this.input.value } })
            
            // Register Id for feedback
            this.result_id = response.data.id;

            // Display result
            await this.display_message.call(this.result, "Did you mean: " + response.data.response, 75)

            await this.useless_delay(400);

            // Display feedback question
            await this.display_message.call(this.feedback_prompt, "Did we get it right?", 80)

            await this.useless_delay(300);

            // Toggle Feedback buttons
            this.toggle_buttons([0, 1]);

        } catch {
            // Display error message
            await this.display_message.call(this.result, "There was an error getting a response. Please try again.", 80)

            await this.useless_delay(400);
        }

        // Reset Button
        document.addEventListener('keypress', this.enter_reset.bind(this, e))
        this.toggle_buttons([2]);
    }

    private toggle_buttons(range: Array<number>) {
        for (let i = 0; i < range.length; i++) {
            this.buttons[range[i]].disabled = !this.buttons[range[i]].disabled;
            this.buttons[range[i]].style.display = this.buttons[range[i]].style.display === "none" ? "inline-block" : "none";
        }
    }

    private async feedback(success: boolean) {
        await axios.post('http://localhost:8000/feedback', { id: this.result_id, success: success })

        await this.remove_displayed_message.call(this.feedback_prompt, 79)
        await this.display_message.call(this.feedback_prompt, "Thank you for your feedback!", 80)
    }

    private enter_reset(e: KeyboardEvent) {
        if (e.key !== 'Enter') return
        this.reset();
    }

    private reset() {
        // Hide/Disable buttons
        let range: Array<number> = [2]
        if (this.buttons[0].disabled) range.push(0, 1);
        this.toggle_buttons(range);

        // Remove enter event listener
        document.removeEventListener('keypress', this.enter_reset.bind(this))

        // Empty out elements
        this.result.innerText = "";
        this.feedback_prompt.innerText = "";
        this.input.value = "";

        // Hide result section
        this.response_section.hidden = true;

        // Reset response id
        this.result_id = undefined;

        // Reset input
        this.input.style.height = "auto";
        this.input.disabled = false;
        this.input.focus();
    }
}

new nametoit();
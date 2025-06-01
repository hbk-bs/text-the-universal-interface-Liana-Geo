//@ts-check
// [x]. get the content from the input element
// [x]. send the content to the val town endpoint using fetch POST request
// [x]. await the response
// [x]. get the json from the response
// [x]. Add the user message to the .chat-history

// How to control the behaviour of the chat bot?

// Bonus:
// What happens if the context gets to long?
// What happens if the chat-history window get s to full (scolling)

let messageHistory = {
	// messages: [{role: user | assistant | system; content: string}]
	response_format: { type: 'json_object' },
	messages: [
		{
			role: 'system',
			content: `
			 You are a skilled writer who has made himself the challenge to write a story based on the random input of a selection of colors. If the story isn’t good, you risk losing your home with everything you love, like your childhood cat. The colors you’re given represent an aspect to put into the story. Red means danger, you add an imminent danger to the story. Orange should add another character to the story. Yellow should add optimism to the story and or make something good happen. Green should add something natural to the story, like a forest or an animal. Blue should make the story pessimistic and add sadness to it. Purple should add something supernatural, like ghosts or magic. Pink should add a romantic aspect to it. Black should make someone die in the story. When youre given the input of start you start the story, if youre giving the input of end you end the story. Remember, your livelihood is on the line. response in JSON. Keep your responses 3 sentences short so it's easy to be engaged with it for people with short attention spans. Make it start with mundane things, day to day life, with the setting being the University of FIne Arts in Braunschweig, Germany.
			`,
		},
	],
};

// TODO: use your own val.town endpoint
// remix: https://val.town/remix/ff6347-openai-api
const apiEndpoint = 'https://lianageo--2fae5f5953854a7a93380424561eeddc.web.val.run';
if (!apiEndpoint.includes('run')) {
	throw new Error('Please use your own val.town endpoint!!!');
}

const MAX_HISTORY_LENGTH = 10;

document.addEventListener('DOMContentLoaded', () => {
	// get the history element
	const chatHistoryElement = document.querySelector('.chat-history');
	const inputElement = document.querySelector('input');
	const formElement = document.querySelector('form');
	// check if the elements exists in the DOM
	if (!chatHistoryElement) {
		throw new Error('Could not find element .chat-history');
	}
	if (!formElement) {
		throw new Error('Form element does not exists');
	}
	if (!inputElement) {
		throw new Error('Could not find input element');
	}
	// run a function when the user hits send
	formElement.addEventListener('submit', async (event) => {
		event.preventDefault(); // dont reload the page

		const formData = new FormData(formElement);
		const content = formData.get('content');
		if (!content) {
			throw new Error("Could not get 'content' from form");
		}
		//@ts-ignore
		messageHistory.messages.push({ role: 'user', content: content });
		messageHistory = truncateHistory(messageHistory);
		chatHistoryElement.innerHTML = addToChatHistoryElement(messageHistory);
		inputElement.value = '';
		scrollToBottom(chatHistoryElement);

		const response = await fetch(apiEndpoint, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify(messageHistory),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(errorText);
		}

		const json = await response.json();
		console.log(json);
		// @ts-ignore
		messageHistory.messages.push(json.completion.choices[0].message);
		messageHistory = truncateHistory(messageHistory);

		chatHistoryElement.innerHTML = addToChatHistoryElement(messageHistory);
		scrollToBottom(chatHistoryElement);
	});
});

	// Add event listeners for color buttons
	const colorButtons = document.querySelectorAll('.color-buttons button');
	colorButtons.forEach(button => {
		button.addEventListener('click', () => {
			const color = button.getAttribute('data-color');
			if (!color) return;
			handleColorInput(color);
		});
	});

		// Add event listeners for special message buttons (start, end)
	const specialButtons = document.querySelectorAll('.submit-buttons button');
	specialButtons.forEach(button => {
		button.addEventListener('click', () => {
			const message = button.getAttribute('data-special');
			if (!message) return;
			handleColorInput(message); // Reuses the same function to send it
		});
	});


function addToChatHistoryElement(mhistory) {
	const htmlStrings = mhistory.messages.map((message) => {
		return message.role === 'system'
			? ''
			: `<div class="message ${message.role}">${message.content}</div>`;
	});
	return htmlStrings.join('');
}

async function handleColorInput(color) {
	const chatHistoryElement = document.querySelector('.chat-history');
	if (!chatHistoryElement) return;

	messageHistory.messages.push({ role: 'user', content: color });
	messageHistory = truncateHistory(messageHistory);
	chatHistoryElement.innerHTML = addToChatHistoryElement(messageHistory);
	scrollToBottom(chatHistoryElement);

	const response = await fetch(apiEndpoint, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(messageHistory),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(errorText);
	}

	const json = await response.json();
	// @ts-ignore
	messageHistory.messages.push(json.completion.choices[0].message);
	messageHistory = truncateHistory(messageHistory);
	chatHistoryElement.innerHTML = addToChatHistoryElement(messageHistory);
	scrollToBottom(chatHistoryElement);
}


function scrollToBottom(conainer) {
	conainer.scrollTop = conainer.scrollHeight;
}

function truncateHistory(h) {
	if (!h || !h.messages || h.messages.length <= 1) {
		return h; // No truncation needed or possible
	}
	const { messages } = h;
	const [system, ...rest] = messages;
	if (rest.length - 1 > MAX_HISTORY_LENGTH) {
		return { messages: [system, ...rest.slice(-MAX_HISTORY_LENGTH)] };
	} else {
		return h;
	}
}






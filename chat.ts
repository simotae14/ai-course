import { openai } from './openai'
import readline from 'node:readline' // to read data from a readable stream

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// setting up a readline User interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// create a message where you call the open ai API to send the chat history
// and the latest message to OpenAI, gets the AI's response and returns it
const newMessage = async (history: Message[], message: Message) => {
  const chatCompletion = await openai.chat.completions.create({
    messages: [...history, message],
    model: 'gpt-3.5-turbo',
    temperature: 0, // the accuracy, between 0 and 2
  })

  return chatCompletion.choices[0].message
}

// This function formats the user message
const formatMessage = (userInput: string): Message => ({
  role: 'user',
  content: userInput,
})

// Chat function handles the chat loop
const chat = () => {
  // create the history
  const history: Message[] = [
    // initial story
    {
      role: 'system',
      content: `You are a helpful AI assistant. Answer the user's questions to the best of you ability.`,
    },
  ]

  const start = () => {
    rl.question('You: ', async (userInput) => {
      // how to exit
      if (userInput.toLowerCase() === 'exit') {
        rl.close()
        return
      }

      const userMessage = formatMessage(userInput)
      const response = await newMessage(history, userMessage)

      if (response.content !== null) {
        history.push(userMessage, {
          role: response.role,
          content: response.content || '',
        }) // update history
        console.log(`\n\nAI: ${response.content}\n\n`)
      } else {
        console.log(`\n\nAI: Sorry, I couldn't generate a response.\n\n`)
      }
      start() // recursion
    })
  }

  console.log('\n\nAI: How can I help you today?\n\n')
  start()
}

console.log("Chatbot initialized. Type 'exit' to end the chat.")
chat()

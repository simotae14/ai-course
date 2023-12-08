// Example Function Calling
import { openai } from './openai'
import math from 'advanced-calculator'

const QUESTION = process.argv[2] || 'hi'

// initialize an array with the user's question
const messages = [
  {
    role: 'user',
    content: QUESTION,
  },
]

// define an object with all the functions, in our case calculate
const functions = {
  calculate: async ({ expression }: { expression: string }) => {
    return math.evaluate(expression)
  },
  // Generate images with dall e
  generateImage: async ({ prompt }) => {
    const result = await openai.images.generate({ prompt })
    console.log(result)
    return ''
  },
}

const getCompletion = (messages) => {
  return openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0613',
    messages,
    temperature: 0,
    // function_call: { name: 'calculate' },
    functions: [
      {
        name: 'calculate',
        description: 'Run a math expression',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              // describe the paramater
              description:
                'Then math expression to evaluate like "2 * 3 + (21 / 2) ^ 2"',
            },
          },
          required: ['expression'], // parameters required
        },
      },
      {
        name: 'generateImage',
        description: 'Create or generate image based on a description',
        parameters: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              // describe the paramater
              description: 'The description of the image to generate',
            },
          },
          required: ['prompt'], // parameters required
        },
      },
    ],
  })
}

let response
while (true) {
  response = await getCompletion(messages)

  // specify when we have done
  if (response.choices[0].finish_reason === 'stop') {
    console.log(response.choices[0].message.content)
    break
  } else if (response.choices[0].finish_reason === 'function_call') {
    const fnName = response.choices[0].message.function_call?.name
    const args = response.choices[0].message.function_call?.arguments

    const functionToCall = functions[fnName]
    const params = JSON.parse(args)

    const result = functionToCall(params)

    messages.push({
      role: 'assistant',
      content: null,
      function_call: {
        name: fnName,
        arguments: args,
      },
    })

    messages.push({
      role: 'function',
      name: fnName,
      content: JSON.stringify({
        result,
      }),
    })
  }
}

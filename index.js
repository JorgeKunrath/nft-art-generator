const {
  readFileSync,
  writeFileSync,
  readdirSync,
  rmSync,
  existsSync,
  mkdirSync,
} = require('fs')
const sharp = require('sharp')

const template = `
    <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- bg -->
        <!-- head -->
        <!-- hair -->
        <!-- eyes -->
        <!-- nose -->
        <!-- mouth -->
        <!-- beard -->
    </svg>
`

const takenFaces = {}
let idx = 10

const randInt = (max) => Math.floor(Math.random() * (max + 1))
// const randElement = (arr) => arr[Math.floor(Math.random() * arr.length)]

function getLayer(name, skip = 0.0) {
  if (!Math.random() > skip) return ''
  const svg = readFileSync(`./layers/${name}.svg`, 'utf-8')
  const re = /(?<=\<svg\s*[^>]*>)([\s\S]*?)(?=\<\/svg\>)/g
  const layer = svg.match(re)[0]
  return layer
}

async function svgToPng(name) {
  const src = `./out/${name}.svg`
  const dest = `./out/${name}.png`

  const img = sharp(src)
  const resized = img.resize(1024)
  await resized.toFile(dest)
}

async function createImage(idx) {
  // TODO: insert rarity
  // TODO: check for layers exclusions
  const bg = randInt(5)
  const hair = randInt(7)
  const eyes = randInt(9)
  const nose = randInt(4)
  const mouth = randInt(5)
  const beard = randInt(3)

  // FIXME: verify if it works when randInts are bigger than 9
  const face = [hair, eyes, mouth, nose, beard].join('')

  if (face[takenFaces]) {
    createImage()
  } else {
    face[takenFaces] = face

    const final = template
      .replace('<!-- bg -->', getLayer(`bg${bg}`))
      .replace('<!-- head -->', getLayer('head0'))
      .replace('<!-- hair -->', getLayer(`hair${hair}`))
      .replace('<!-- eyes -->', getLayer(`eyes${eyes}`))
      .replace('<!-- nose -->', getLayer(`nose${nose}`))
      .replace('<!-- mouth -->', getLayer(`mouth${mouth}`))
      .replace('<!-- beard -->', getLayer(`beard${beard}`, 0.5))

    const meta = {
      name: `${idx}`,
      description: '',
      image: `${idx}.png`,
      attributes: [
        {
          beard: '',
          rarity: 0.5,
        },
      ],
    }
    writeFileSync(`./out/${idx}.json`, JSON.stringify(meta))
    writeFileSync(`./out/${idx}.svg`, final)
    await svgToPng(idx)
  }
}

function setup() {
  // Create dir if not exists
  if (!existsSync('./out')) {
    mkdirSync('./out')
  }

  // Cleanup dir before each run
  readdirSync('./out').forEach((f) => rmSync(`./out/${f}`))
}

async function run() {
  setup()
  while (idx > 0) {
    await createImage(idx)
    idx--
  }
}

run()

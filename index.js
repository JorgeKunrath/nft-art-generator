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

const takenFaces = []
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

// FIXME: this logic might be wrong
const alreadyExists =
  (test, threshold = 2) =>
  (base) => {
    const baseArr = base.match(/.{2}/g)
    const testArr = test.match(/.{2}/g)
    const equals = baseArr.filter((val, idx) => val === testArr[idx])
    const result = equals.length <= threshold
    return !result
  }

async function createImage(idx) {
  // TODO: insert rarity
  // TODO: check for layers exclusions
  const traitId = {
    bg: `${randInt(5)}`.padStart(2, '0'),
    head: `${randInt(0)}`.padStart(2, '0'),
    hair: `${randInt(7)}`.padStart(2, '0'),
    eyes: `${randInt(9)}`.padStart(2, '0'),
    nose: `${randInt(4)}`.padStart(2, '0'),
    mouth: `${randInt(5)}`.padStart(2, '0'),
    beard: `${randInt(3)}`.padStart(2, '0'),
  }

  const face = [traitId.hair, traitId.eyes, traitId.mouth, traitId.nose, traitId.beard]
    .map((val) => `${val}`.padStart(2, '0'))
    .join('')

  if (takenFaces.some(alreadyExists(face))) {
    createImage(idx)
  } else {
    takenFaces.push(face)

    const final = template
      .replace('<!-- bg -->', getLayer(`bg${traitId.bg}`))
      .replace('<!-- head -->', getLayer(`head${traitId.head}`))
      .replace('<!-- hair -->', getLayer(`hair${traitId.hair}`))
      .replace('<!-- eyes -->', getLayer(`eyes${traitId.eyes}`))
      .replace('<!-- nose -->', getLayer(`nose${traitId.nose}`))
      .replace('<!-- mouth -->', getLayer(`mouth${traitId.mouth}`))
      .replace('<!-- beard -->', getLayer(`beard${traitId.beard}`, 0.5))

    const meta = {
      name: `${idx}`,
      description: '',
      image: `${idx}.png`,
      faceHash: face,
      face: traitId,
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
  console.log('takenFaces', takenFaces)
}

run()

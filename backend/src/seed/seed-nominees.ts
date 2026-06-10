import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import mongoose from 'mongoose'
import { connectDB, disconnectDB } from '../config/db.js'
import { env } from '../config/env.js'
import { cloudinary } from '../config/cloudinary.js'
import { Category } from '../models/category.model.js'
import { Nominee } from '../models/nominee.model.js'
import { logger } from '../config/pino.js'

const IMAGES_DIR = join(new URL('.', import.meta.url).pathname, '../../images')

interface NomineeInput {
  name: string
  position: string
  department: string
  faculty: string
  imageFile: string
}

const NOMINEES: Record<string, NomineeInput[]> = {
  'male-ballon-dor': [
    { name: 'Ajibade Charles Joshua', position: 'CM / AM', department: 'Estate Management', faculty: 'Environmental Design & Management', imageFile: 'ajibade-charles.webp' },
    { name: 'Akinwole Feranmi John', position: 'LW / RW', department: 'Agricultural Economics & Extension', faculty: 'Agriculture', imageFile: 'akinwole-feranmi.webp' },
    { name: 'Obe Henry', position: 'Striker (9)', department: 'Public Administration', faculty: 'Management Sciences', imageFile: 'obe-henry.webp' },
    { name: 'Falade Samuel', position: 'Striker', department: 'Geology', faculty: 'Physical Sciences', imageFile: 'falade-samuel.webp' },
    { name: 'Adamolekun Ayomide', position: 'Left Wing', department: 'Human Kinetics & Health Education', faculty: 'Education', imageFile: 'adamolekun-ayomide.webp' },
    { name: 'Oladele Damilola', position: 'Left Wing', department: 'Biochemistry', faculty: 'Life Sciences', imageFile: 'oladele-damilola.webp' },
    { name: 'Oyewole Samson', position: 'CB / CMF', department: 'Finance', faculty: 'Management Sciences', imageFile: 'oyewole-samson.webp' },
    { name: 'Aderoju Israel Oluwatomiwa', position: 'RWF / AMF', department: 'Mass Communication', faculty: 'Communication & Media Studies', imageFile: 'aderoju-isreal.webp' },
    { name: 'Akinwande Kayode Isaac', position: 'LWF', department: 'Anatomy', faculty: 'Basic Medical Science', imageFile: 'akinwande-kayode.webp' },
    { name: 'Teniola Samuel', position: 'Midfielder', department: 'Radiography & Radiation Science', faculty: 'Basic Medical Science', imageFile: 'teniola-samuel.webp' },
    { name: 'Moyosore S. Tobiloba', position: 'CM / AM', department: 'Political Science', faculty: 'Social Sciences', imageFile: 'moyosore-tobiloba.webp' },
    { name: 'Omoyeni M. Mercy', position: 'DMF', department: 'Criminology', faculty: 'Social Sciences', imageFile: 'omoyeni-mercy.webp' },
    { name: 'Ogunyemi Israel', position: 'Midfielder', department: 'Computer Science', faculty: 'Computing', imageFile: 'ogunyemi-isreal.webp' },
    { name: 'Ajayi Boluwatife', position: 'LWF (11)', department: 'History & International Studies', faculty: 'Arts', imageFile: 'ajayi-boluwatife.webp' },
    { name: 'Famisa Victor Oluwaduyilemi', position: 'Wingback', department: 'Mechatronics Engineering', faculty: 'Engineering', imageFile: 'famisa-victor.webp' },
    { name: 'Raji Toheeb Olamilekan', position: 'Midfielder', department: 'Agric & Bio-Resources Engineering', faculty: 'Engineering', imageFile: 'raji-toheeb.webp' },
    { name: 'Osaro Daniel', position: 'LWF (11)', department: 'Linguistics & Languages', faculty: 'Arts', imageFile: 'osaro-daniel.webp' },
    { name: 'Adeyemi Oluwaseun', position: 'CB', department: 'Biochemistry', faculty: 'Life Sciences', imageFile: 'adeyemi-oluwaseun.webp' },
    { name: 'Akinsominu Paul Abiodun', position: 'Midfielder', department: 'Agricultural Education', faculty: 'Education', imageFile: 'akinsominu-paul.webp' },
    { name: 'Omiyale Damilola Henry', position: 'DMF / CMF', department: 'History & International Studies', faculty: 'Arts', imageFile: 'omiyale-damilola.webp' },
  ],
  'female-ballon-dor': [
    { name: 'Akinwumi O. Olamide', position: 'CM / AM', department: 'Criminology', faculty: 'Social Sciences', imageFile: 'akinwunmi-olamide.webp' },
    { name: 'Omowunmi Precious Longe', position: 'GK', department: 'Finance', faculty: 'Management Sciences', imageFile: 'omowunmi-precious.webp' },
    { name: 'Fasunon Favour Oluwatomisin', position: 'Striker (9)', department: 'Journalism', faculty: 'Communication & Media Studies', imageFile: 'fasunon-favour.webp' },
    { name: 'Oludare Ayomide', position: 'Midfielder', department: 'Architecture', faculty: 'Environmental Design & Management', imageFile: 'oludare-ayomide.webp' },
    { name: 'Adeparua Yetunde Adefunke', position: 'CB', department: 'Microbiology', faculty: 'Life Sciences', imageFile: 'adeparau-yetunde.webp' },
    { name: 'Ogedengbe Bolaji Temidire', position: 'CMF', department: 'Chemistry', faculty: 'Physical Sciences', imageFile: 'ogedengbe-bolaji.webp' },
    { name: 'Chukwunyere Ijeoma Ayomide', position: 'RW', department: 'Nursing', faculty: 'Basic Medical Science', imageFile: 'chukwunyere-ijeoma.webp' },
    { name: 'Ogungbe Bisola Herodia', position: 'CB', department: 'Radiography & Radiation Science', faculty: 'Basic Medical Science', imageFile: 'ogungbe-bisola.webp' },
    { name: 'Abdullahi Shifau', position: 'GK', department: 'Statistics', faculty: 'Physical Sciences', imageFile: 'abdullahi-shifau.webp' },
    { name: 'Yusuf Peace Olayinka', position: 'Defender (6)', department: 'Accounting', faculty: 'Management Sciences', imageFile: 'yusuf-peace.webp' },
    { name: 'Nwani Blessing', position: 'DMF', department: 'Business Education', faculty: 'Education', imageFile: 'nwani-blessing.webp' },
    { name: 'Grace Ekwe', position: 'Right Wing', department: 'Biochemistry', faculty: 'Life Sciences', imageFile: 'grace-ekwe.webp' },
    { name: 'Agunbiade Oluwatelemi Ololade', position: 'Striker (9)', department: 'Building', faculty: 'Environmental Design & Management', imageFile: 'agunbiade-oluwatelemi.webp' },
    { name: 'Onyemaechi Comfort Uzunma', position: 'Striker', department: 'Business Administration', faculty: 'Management Sciences', imageFile: 'onyemachi-comfort.webp' },
    { name: 'Ogunbowale T. Boluwatife', position: 'Forward', department: 'Criminology', faculty: 'Social Sciences', imageFile: 'ogunbowale-boluwatife.webp' },
    { name: 'Oladoyin Olamide', position: 'Winger', department: 'Library & Information Science', faculty: 'Education', imageFile: 'oladoyin-olamide.webp' },
    { name: 'Oni-Praise Abiodun', position: 'Striker', department: 'Software Engineering', faculty: 'Computing', imageFile: 'oni-praise.webp' },
  ],
  'kopa-trophy': [
    { name: 'Owolewa Muiz', position: 'AM', department: 'Demography & Social Statistics', faculty: 'Social Sciences', imageFile: 'owolewa-muiz.webp' },
    { name: 'Oghai Victor', position: 'CF / AM', department: 'Agric & Bio-Resources Engineering', faculty: 'Engineering', imageFile: 'oghai-victor.webp' },
    { name: 'Matthew Oluwatimilehin Samuel', position: 'RWF', department: 'Animal & Environmental Biology', faculty: 'Life Sciences', imageFile: 'matthew-oluwatimilehin.webp' },
    { name: 'Chibuike Chidera David', position: 'DMF', department: 'Software Engineering', faculty: 'Computing', imageFile: 'chibuike-chidera.webp' },
    { name: 'Ogunleye Adeyemi Opeyemi', position: 'Striker', department: 'Statistics', faculty: 'Physical Sciences', imageFile: 'ogunleye-adeyemi.webp' },
    { name: 'Bakare B. Emmanuel', position: 'CM / AM', department: 'Economics', faculty: 'Social Sciences', imageFile: 'bakare-emmanuel.webp' },
  ],
  'yashin-trophy': [
    { name: 'Samuel Damilare', position: 'GK', department: 'Animal & Environmental Biology', faculty: 'Life Sciences', imageFile: 'samuel-damilare.webp' },
    { name: 'Onugha Stephen', position: 'GK', department: 'Political Science', faculty: 'Social Sciences', imageFile: 'onugha-stephen.webp' },
    { name: 'Adedokun Jeremiah', position: 'GK', department: 'Criminology', faculty: 'Social Sciences', imageFile: 'adedokun-jeremiah.webp' },
    { name: 'Kolapo Abass Olagoke', position: 'GK', department: 'Computer Science', faculty: 'Computing', imageFile: 'kolapo-abass.webp' },
    { name: 'Gidado Ibrahim', position: 'GK', department: 'Surveying & Geoinformatics', faculty: 'Environmental Design & Management', imageFile: 'gidado-ibrahim.webp' },
    { name: 'Badmus Emmanuel', position: 'GK', department: 'Mechatronics Engineering', faculty: 'Engineering', imageFile: 'badmus-ennanuel.webp' },
    { name: 'Alao Ayomide Samuel', position: 'GK', department: 'Electrical & Electronics Engineering', faculty: 'Engineering', imageFile: 'alao-ayomide.webp' },
    { name: 'Oyewole Abdulroqeeb Adebayo', position: 'GK', department: 'Quantity Surveying', faculty: 'Environmental Design & Management', imageFile: 'oyewole-abdulroqeeb.webp' },
    { name: 'Isadare Dele Adeoye', position: 'GK', department: 'Soil Science & Land Resources Management', faculty: 'Agriculture', imageFile: 'isadare-dele.webp' },
    { name: 'Omoniyi Victor', position: 'GK', department: 'Library & Information Science', faculty: 'Education', imageFile: 'omoniyi-victor.webp' },
    { name: 'Tadese Sodiq', position: 'GK', department: 'Industrial Chemistry', faculty: 'Physical Sciences', imageFile: 'tadese-sodiq.webp' },
    { name: 'Ajewole Temitope Michael', position: 'GK', department: 'Accounting', faculty: 'Management Sciences', imageFile: 'ajewole-temitope.webp' },
  ],
  'defender-of-the-year': [
    { name: 'Oyewole Samson', position: 'CB', department: 'Finance', faculty: 'Management Sciences', imageFile: 'oyewole-samson.webp' },
    { name: 'Owojaiye Victor', position: 'CB', department: 'Animal & Environmental Biology', faculty: 'Life Sciences', imageFile: 'owojaiye-victor.webp' },
    { name: 'Didi Izuchukwu', position: 'CB', department: 'Biochemistry', faculty: 'Life Sciences', imageFile: 'didi-izuchukwu.webp' },
    { name: 'Falodun Ebenezer', position: 'RB', department: 'Mechanical Engineering', faculty: 'Engineering', imageFile: 'falodun-ebenezer.webp' },
    { name: 'Oludiaro Ifeoluwa', position: 'Defender', department: 'Computer Science', faculty: 'Computing', imageFile: 'oludiaro-ifeoluwa.webp' },
    { name: 'Onafowokan Olarenwaju Idunuoluwa', position: 'CB / RB', department: 'Mathematics', faculty: 'Physical Sciences', imageFile: 'onafowokan-olarenwaju.webp' },
    { name: 'Johnson Joshua', position: 'Defender', department: 'Computer Science', faculty: 'Computing', imageFile: 'johnson-joshua.webp' },
    { name: 'Akinyeye Timothy Akintunde', position: 'Defender', department: 'Mass Communication', faculty: 'Communication & Media Studies', imageFile: 'akinyeye-timothy.webp' },
    { name: 'Ogisuah Samuel Oluwaseun', position: 'Defender', department: 'Business Administration', faculty: 'Management Sciences', imageFile: 'ogisuah-samuel.webp' },
    { name: 'Asekunola Iyanu Sunday', position: 'Defender', department: 'Agricultural Education', faculty: 'Education', imageFile: 'asekunola-iyanu.webp' },
    { name: 'Afesojaye Matthew Obaloluwa', position: 'CB', department: 'Physics', faculty: 'Physical Sciences', imageFile: 'afesojaye-matthew.webp' },
    { name: 'Siyanbola Abdulsamad Ayomide', position: 'CD', department: 'Quantity Surveying', faculty: 'Environmental Design & Management', imageFile: 'siyanbola-abdulsamad.webp' },
    { name: 'Adeyemi Oluwaseun', position: 'CB', department: 'Biochemistry', faculty: 'Life Sciences', imageFile: 'adeyemi-oluwaseun.webp' },
    { name: 'Folashade Israel Olumide', position: 'CB (6)', department: 'Philosophy', faculty: 'Arts', imageFile: 'folashade-isreal.webp' },
    { name: 'Olayiwola Daniel', position: 'CB / RB', department: 'Political Science', faculty: 'Social Sciences', imageFile: 'olayiwola-daniel.webp' },
    { name: 'Enemali John', position: 'CB', department: 'Political Science', faculty: 'Social Sciences', imageFile: 'enemali-john.webp' },
  ],
  'playmaker-of-the-year': [
    { name: 'Folorunso-Davies Olumide', position: 'CM', department: 'Medical Laboratory Science', faculty: 'Basic Medical Science', imageFile: 'folorunso-davies.webp' },
    { name: 'Chibuike Chidera David', position: 'DMF', department: 'Software Engineering', faculty: 'Computing', imageFile: 'chibuike-chidera.webp' },
    { name: 'Tiamiyu Franklin', position: 'DMF', department: 'Estate Management', faculty: 'Environmental Design & Management', imageFile: 'tiamiyu-franklin.webp' },
    { name: 'Ajibade Charles Joshua', position: 'CM / AM', department: 'Estate Management', faculty: 'Environmental Design & Management', imageFile: 'ajibade-charles.webp' },
    { name: 'Akinwolire Emmanuel Oloruntoba', position: 'DMF / CMF', department: 'Quantity Surveying', faculty: 'Environmental Design & Management', imageFile: 'akinwolire-emmanuel.webp' },
    { name: 'Ajao Joshua Olakunle', position: 'Midfielder', department: 'Finance', faculty: 'Management Sciences', imageFile: 'ajao-joshua.webp' },
    { name: 'Akinfemiwa Victor Idowu', position: 'AM', department: 'Data Science & Analysis', faculty: 'Computing', imageFile: 'akinfenwa-victor.webp' },
    { name: 'Ogunyemi Israel', position: 'Midfielder', department: 'Computer Science', faculty: 'Computing', imageFile: 'ogunyemi-isreal.webp' },
    { name: 'Oni Miracle David', position: 'Midfielder', department: 'Microbiology', faculty: 'Life Sciences', imageFile: 'oni-miracle.webp' },
    { name: 'Joel Victory Jesujoba', position: 'Midfielder', department: 'Animal & Environmental Biology', faculty: 'Life Sciences', imageFile: 'joel-victory.webp' },
    { name: 'Owoeye Victor Agbolahan', position: 'Midfielder', department: 'Mass Communication', faculty: 'Communication & Media Studies', imageFile: 'owoeye-victor.webp' },
    { name: 'Adekanbi Muiz Opeyemi', position: 'DMF', department: 'Physics', faculty: 'Physical Sciences', imageFile: 'adekanbi-muiz.webp' },
    { name: 'Alake Olamide Precious', position: 'AM', department: 'Geophysics', faculty: 'Physical Sciences', imageFile: 'alake-olamide.webp' },
    { name: 'Uzomah Nnemeka Joachim', position: 'AM', department: 'Agric & Bio-Resources Engineering', faculty: 'Engineering', imageFile: 'uzomah-nnemeka.webp' },
    { name: 'Olumide Benjamin', position: 'DMF', department: 'Business Administration', faculty: 'Management Sciences', imageFile: 'olumide-benjamin.webp' },
    { name: 'Femi Johnson', position: 'Midfielder', department: 'Human Kinetics', faculty: 'Education', imageFile: 'femi-johnson.webp' },
    { name: 'Olushola Samuel Oyedepo', position: 'CM', department: 'History & International Studies', faculty: 'Arts', imageFile: 'olushola-samuel.webp' },
    { name: 'Omoyeni M. Mercy', position: 'DMF', department: 'Criminology', faculty: 'Social Sciences', imageFile: 'omoyeni-mercy.webp' },
    { name: 'Bakare B. Emmanuel', position: 'CM / AM', department: 'Economics', faculty: 'Social Sciences', imageFile: 'bakare-emmanuel.webp' },
    { name: 'Teniola Samuel', position: 'Midfielder', department: 'Radiography & Radiation Science', faculty: 'Basic Medical Science', imageFile: 'teniola-samuel.webp' },
  ],
  'attacker-of-the-year': [
    { name: 'Obe Henry', position: 'Striker', department: 'Public Administration', faculty: 'Management Sciences', imageFile: 'obe-henry.webp' },
    { name: 'Adedapo Ibrahim', position: 'Left Wing', department: 'Estate Management', faculty: 'Environmental Design & Management', imageFile: 'adedapo-ibrahim.webp' },
    { name: 'Ayodabo Uthman Kolade', position: 'Right Wing', department: 'Surveying & Geoinformatics', faculty: 'Environmental Design & Management', imageFile: 'ayodabo-uthman.webp' },
    { name: 'Babatunde Michael', position: 'Forward', department: 'Biochemistry', faculty: 'Life Sciences', imageFile: 'babatunde-michael.webp' },
    { name: 'Elias David', position: 'RWF', department: 'Animal & Environmental Biology', faculty: 'Life Sciences', imageFile: 'elias-david.webp' },
    { name: 'Falade Samuel', position: 'Striker', department: 'Geology', faculty: 'Physical Sciences', imageFile: 'falade-samuel.webp' },
    { name: 'Olundegun Raphael Ayoola', position: 'CF', department: 'Materials & Metallurgical Engineering', faculty: 'Engineering', imageFile: 'olundengun-raphael.webp' },
    { name: 'Alabi Olumide Bolaji', position: 'Right Wing', department: 'Civil Engineering', faculty: 'Engineering', imageFile: 'alabi-olumide.webp' },
    { name: 'Ayelade Ayomide', position: 'Attacker', department: 'Computer Science', faculty: 'Computing', imageFile: 'ayelade-ayomide.webp' },
    { name: 'Adamolekun Ayomide', position: 'Attacker', department: 'Human Kinetics & Health Education', faculty: 'Education', imageFile: 'adamolekun-ayomide.webp' },
    { name: 'Bamidele Farouq', position: 'LW / RW', department: 'Political Science', faculty: 'Social Sciences', imageFile: 'bamidele-farouq.webp' },
    { name: 'Oladele Saheed', position: 'LW / RW', department: 'Political Science', faculty: 'Social Sciences', imageFile: 'oladele-saheed.webp' },
    { name: 'Akinwande Kayode', position: 'Forward', department: 'Anatomy', faculty: 'Basic Medical Science', imageFile: 'akinwade-kayode.webp' },
    { name: 'Osaro Daniel', position: 'LWF (11)', department: 'Linguistics & Languages', faculty: 'Arts', imageFile: 'osaro-daniel.webp' },
    { name: 'Olowoeyo Tayelolu Adeyemi', position: 'Striker', department: 'Radiography & Radiation Science', faculty: 'Basic Medical Science', imageFile: 'olowoeye-tayelolu.webp' },
    { name: 'Oladapo Ifeoluwa Ayomide', position: 'Attacker', department: 'Mass Communication', faculty: 'Communication & Media Studies', imageFile: 'oladapo-ifeoluwa.webp' },
  ],
}

async function seedNominees() {
  await connectDB()
  logger.info('Starting nominee seed...')

  let created = 0
  let skipped = 0

  for (const [categorySlug, nominees] of Object.entries(NOMINEES)) {
    const category = await Category.findOne({ slug: categorySlug }).lean()
    if (!category) {
      logger.warn({ slug: categorySlug }, 'Category not found — skipping')
      continue
    }

    for (const nominee of nominees) {
      const existing = await Nominee.findOne({
        categoryId: category._id,
        name: nominee.name,
      }).lean()

      if (existing) {
        skipped++
        continue
      }

      const imagePath = join(IMAGES_DIR, categorySlug, nominee.imageFile)
      const imageBuffer = readFileSync(imagePath)

      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `fuoye-ballondor/nominees/${categorySlug}`, resource_type: 'image' },
          (error: Error | undefined, result: { secure_url: string; public_id: string } | undefined) => {
            if (error || !result) reject(error)
            else resolve(result)
          }
        )
        stream.end(imageBuffer)
      })

      await Nominee.create({
        name: nominee.name,
        imageUrl: uploadResult.secure_url,
        imagePublicId: uploadResult.public_id,
        department: nominee.department,
        faculty: nominee.faculty,
        position: nominee.position,
        categoryId: category._id,
        voteCount: 0,
        isActive: true,
      })

      created++
      logger.info({ name: nominee.name, category: categorySlug }, 'Nominee created')
    }
  }

  logger.info({ created, skipped }, 'Nominee seed complete')
  await disconnectDB()
}

seedNominees().catch((err) => {
  logger.error({ err }, 'Nominee seed failed')
  process.exit(1)
})

const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const ytdl = require('ytdl-core');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const { SpeechClient } = require('@google-cloud/speech');
const { Translate } = require('@google-cloud/translate').v2;
const {
    GOOGLE_APPLICATION_CREDENTIALS,
    TRANSLATE_API_KEY,
} = require('../core/config');

const { getVideoDataById } = require('../services/youtube');
const { createVideo, getLastVideo } = require('../repositories/youtube');

const auth = new google.auth.GoogleAuth({
  credentials: GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

const speech = new SpeechClient({ auth });
const translate = new Translate({
    key: TRANSLATE_API_KEY,
});
const router = express.Router();

ffmpeg.setFfmpegPath(ffmpegPath);

router.get('/video/last/info', async (req, res, next) => {
    try {
        const video = await getLastVideo()
        if (!video.length) throw new Error('Video doesnt exists in DB')
        return res.json(video[0]);
    } catch (err) {
        next()
    }
});

router.get('/video/:id/info', async (req, res, next) => {
    const { id } = req.params

    try {
        const videoInfo = await getVideoDataById(id)
        const video = await createVideo({
            video_id: videoInfo.id,
            ...videoInfo,
        })
        return res.json(video);
    } catch (err) {
        next()
    }
});

const detectLanguage = async (text) => {
  const [result] = await translate.detect(text);
  return result.language;
};

const translateText = async (text, targetLanguage) => {
  const [translation] = await translate.translate(text, targetLanguage);
  return translation;
};

const mostFrequentValue = (array) => {
  const frequency = new Map();

  let FrequentValue;
  let maxFrequency = 0;

  for (const value of array) {
    const currentFrequency = (frequency.get(value) || 0) + 1;
    frequency.set(value, currentFrequency);

    if (currentFrequency > maxFrequency) {
      maxFrequency = currentFrequency;
      FrequentValue = value;
    }
  }

  return FrequentValue;
}

router.get('/video/:id/transcript/audio', async (req, res, next) => {
  try {
    const { id } = req.params;
  const startTime = 30; // Segundos de inicio
    const endTime = 45; // Segundos de final

    // Extraer el audio del video utilizando ytdl-core
    const videoInfo = await ytdl.getInfo(id);
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, { filter: 'audioonly' });
    const audioStream = await ytdl.downloadFromInfo(videoInfo, { format: audioFormat });

    // Crear un flujo de audio temporal para cortar
    const tempAudioStream = ffmpeg()
        .input(audioStream)
        .inputFormat('webm')
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .format('wav')
        .pipe();

    const audioChunks = [];
    tempAudioStream.on('data', (chunk) => {
      audioChunks.push(chunk);
    });

      tempAudioStream.on('end', async () => {
        const audioBuffer = Buffer.concat(audioChunks);
          const audioContent = audioBuffer.toString('base64');
          const chunkSize = 100000;
          const chunks = []
        for (let i = 0; i < audioContent.length; i += chunkSize) {
            // Detectar el idioma antes de enviar a Speech-to-Text
            chunks.push(audioContent.slice(i, i + chunkSize));
        }
          res.status(200).json({ audio_content: chunks });
      })
  } catch (err) {
        console.error('Error en la transcripción:', err);
        res.status(500)
        next()
  }
});

router.post('/video/translate', bodyParser.text({ type: 'text/plain' }), async (req, res, next) => {
    const audio_content = req.body
    console.log(req.body)
    try {
           const audio = {
                content: audio_content,
            };

            const chunkSize = 100000; // Tamaño del fragmento, ajusta según tus necesidades
            const detectedLenguages = [];
            for (let i = 0; i < audio_content.length; i += chunkSize) {
                // Detectar el idioma antes de enviar a Speech-to-Text
                const detectedLanguage = await detectLanguage(audio_content.slice(i, i + chunkSize));
                detectedLenguages.push(detectedLanguage);
            }
            const mostFrequentDetectedLanguage = mostFrequentValue(detectedLenguages)

            // Transcribir el fragmento de audio
            const config = {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: mostFrequentDetectedLanguage,
            };

            const request = {
                audio,
                config,
            };

            const [response] = await speech.recognize(request);
            const transcription = response.results.map(result => result.alternatives[0].transcript).join(' ');
            const translatedText = await translateText(transcription, 'es-ES');
        return res.json({ translation: translatedText });
    } catch (err) {
        console.error('Error en la transcripción:', err);
        res.status(500)
        next()
    }
});

router.post('/video/:id', async (req, res, next) => {
    const { title } = req.body
    try {
        const video = await createVideo({ title })
        return res.json(video);
    } catch (err) {
        next()
    }
});

module.exports = router;

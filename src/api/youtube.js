const express = require('express');
const { google } = require('googleapis');
const ytdl = require('ytdl-core');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const { SpeechClient } = require('@google-cloud/speech');
const translate = require('translate-google');
const fetch = require('node-fetch');
const {
    GOOGLE_APPLICATION_CREDENTIALS,
} = require('../core/config');

const { getVideoDataById } = require('../services/youtube');
const { createVideo, getLastVideo, updateVideoTranslation } = require('../repositories/youtube');
const { createTranscription, getTranscriptionBySearch } = require('../repositories/transcription');

const auth = new google.auth.GoogleAuth({
  credentials: GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

const speech = new SpeechClient({ auth });
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

const translateText = async (text, targetLanguage) => {
  try {
        const translation = await translate(text, { from: 'en', to: targetLanguage });
        return translation;
  } catch (error) {
    console.error('Error during translation:', error.message);
    throw error;
  }
};

router.get('/video/:id/translation', async (req, res, next) => {
    const { id } = req.params
    try {
        const transcription = (await getTranscriptionBySearch({ video_id: id }))[0]
        if (!transcription) throw new Error("Transcription not found")

            const audio_content = transcription.transcription
           const audio = {
                content: audio_content,
            };

            // Transcribir el fragmento de audio
            const config = {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: transcription.language,
            };

            const request = {
                audio,
                config,
            };

            const [response] = await speech.recognize(request);
            const transcriptionText = response.results.map(result => result.alternatives[0].transcript).join(' ');
            const translatedText = await translateText(transcriptionText, 'es');
        return res.json({ translation: translatedText });
    } catch (err) {
        console.error('Error en la transcripción:', err);
        res.status(500)
        next()
    }
});

router.post('/video/thumbnail/download', async (req, res) => {
    const { thumbnail } = req.body
    console.log(thumbnail, req.body)
    const imageUrl = thumbnail;

  try {
    const response = await fetch(imageUrl);
    const imageBuffer = await response.buffer();

    // Convert the Buffer to a base64 string
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:${response.headers.get('content-type')};base64,${base64Image}`;

    // Send the Buffer as the response
    res.send({ image: dataUri });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al procesar la solicitud.');
  }
});

router.post('/video/:id/transcript/audio', async (req, res, next) => {
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

        const transcription = await createTranscription({
            video_id: id,
            transcription: audioContent,
            language: 'en',
        })
          res.status(200).json({
              id: transcription._id,
              video_id: id,
              language: 'en',
          });
      })
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

router.patch('/video/:id/translation', async (req, res, next) => {
    const { id } = req.params
    const { translation } = req.body
    try {
        const video = await updateVideoTranslation({ video_id: id, translation })

        return res.json(video);
    } catch (err) {
        next()
    }
});

module.exports = router;

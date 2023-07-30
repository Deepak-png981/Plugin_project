const fs = require('fs');
const WavDecoder = require('wav-decoder');
const createFft = require('fourier-transform');
const { PNG } = require('pngjs');
const Jimp = require('jimp');

// 1. Convert Audio to Spectrogram
const decodeAudioData = async (audioFilePath) => {
    const audioData = fs.readFileSync(audioFilePath);
    const decodedData = await WavDecoder.decode(audioData);
    return decodedData.channelData[0]; // Mono audio
};

const createSpectrogram = (audioData, fftSize) => {
    const fft = createFft(fftSize);
    const spectrogram = [];

    // We're rounding down to ensure we only consider full slices.
    const numberOfSlices = Math.floor(audioData.length / fftSize);

    for (let i = 0; i < numberOfSlices; i++) {
        const sliceStart = i * fftSize;
        const sliceEnd = sliceStart + fftSize;
        const slice = audioData.slice(sliceStart, sliceEnd);
        const spectrum = fft(slice);
        spectrogram.push(spectrum);
    }

    return spectrogram;
};



// 2. Save the Spectrogram as an Image
const createSpectrogramImage = (spectrogram, outputPath) => {
    const png = new PNG({
        width: spectrogram.length,
        height: spectrogram[0].length,
    });
    spectrogram.forEach((spectrum, i) => {
        spectrum.forEach((value, j) => {
            const idx = (png.width * j + i) << 2;
            const color = Math.round(255 * value);
            png.data[idx] = color;
            png.data[idx + 1] = color;
            png.data[idx + 2] = color;
            png.data[idx + 3] = 255;
        });
    });
    fs.writeFileSync(outputPath, PNG.sync.write(png));
};

// 3. Load the Image and Apply Filters
const applyImageFilter = async (inputPath, outputPath) => {
    const image = await Jimp.read(inputPath);
    image.greyscale().write(outputPath);
};

// Execute
const run = async () => {
    const audioData = await decodeAudioData('./input.wav');
    const spectrogram = createSpectrogram(audioData, 2048);
    createSpectrogramImage(spectrogram, './spectrogram.png');
    await applyImageFilter('./spectrogram.png', './filtered.png');
};

run().catch(console.error);

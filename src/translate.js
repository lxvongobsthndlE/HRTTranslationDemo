const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
const { IamAuthenticator } = require('ibm-watson/auth');


/**
 * Helper 
 * @param {*} errorMessage 
 * @param {*} defaultLanguage 
 */
function getTheErrorResponse(errorMessage, defaultLanguage) {
    return {
        statusCode: 500,
        body: {
            language: defaultLanguage || 'en',
            errorMessage: errorMessage
        }
    };
}

/**
  *
  * main() will be run when teh action is invoked
  *
  * @param params Cloud Functions actions accept a single parameter, which must be a JSON object.
  *
  * @return The output of this action, which must be a JSON object.
  *
  */
function main(params) {

    /*
     * The default language to choose in case of an error
     */
    const defaultLanguage = 'en';

    return new Promise(function (resolve, reject) {

        try {

            // *******TODO**********
            // - Call the language translation API of the translation service
            // see: https://cloud.ibm.com/apidocs/language-translator?code=node#translate
            // - if successful, resolve exatly like shown below with the
            // translated text in the "translation" property,
            // the number of translated words in "words"
            // and the number of characters in "characters".

            // in case of errors during the call resolve with an error message according to the pattern
            // found in the catch clause below

            // pick the language with the highest confidence, and send it back

            const languageTranslator = new LanguageTranslatorV3({
                version: '2018-05-01',
                authenticator: new IamAuthenticator({
                    apikey: 't9Lc6dXHLOw2hB5nsBzO7MWuEK6NJBTJqBev1NEdimYN',
                }),
                url: 'https://api.eu-de.language-translator.watson.cloud.ibm.com/instances/94f854d9-cd5b-4c7a-936a-b5f21d9147d2',
            });

            var textToTranslate = params.body.text;
            var sourceLanguage = params.body.language;
            var toLanguage = params.body.toLanguage || "en";
            console.log(JSON.stringify(params, null, 2));
            var translateParams = {
                text: textToTranslate,
                modelId: sourceLanguage + "-" + toLanguage,
            };

            if (sourceLanguage === toLanguage) {
                resolve({
                    statusCode: 200,
                    body: {
                        translations: textToTranslate,
                        words: textToTranslate.split(" ").length,
                        characters: textToTranslate.length,
                    },
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            else {
                if (sourceLanguage !== "en") {
                    translateParams = {
                        text: textToTranslate,
                        modelId: sourceLanguage + "-en",
                    };
                    languageTranslator.translate(translateParams)
                        .then(translationResult => {
                            console.log(JSON.stringify(translationResult, null, 2));
                            textToTranslate = translationResult.result.translations[0].translation;

                            if (toLanguage === "en") {
                                resolve({
                                    statusCode: 200,
                                    body: {
                                        translations: textToTranslate,
                                        words: textToTranslate.split(" ").length,
                                        characters: textToTranslate.length,
                                    },
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            }
                            else {
                                translateParams = {
                                    text: textToTranslate,
                                    modelId: "en-" + toLanguage,
                                }
                                languageTranslator.translate(translateParams)
                                    .then(translationResult2 => {
                                        console.log(JSON.stringify(translationResult2, null, 2));
                                        textToTranslate = translationResult2.result.translations[0].translation;

                                        resolve({
                                            statusCode: 200,
                                            body: {
                                                translations: textToTranslate,
                                                words: translationResult2.result.word_count,
                                                characters: translationResult2.result.character_count,
                                            },
                                            headers: { 'Content-Type': 'application/json' }
                                        });
                                    })
                                    .catch(err => {
                                        console.log('error:', err);
                                        resolve(getErrorResponse(err.result.message, defaultLanguage))
                                    });
                            }
                        })
                        .catch(err => {
                            console.log('error:', err);
                            resolve(getErrorResponse(err.result.message, defaultLanguage))
                        });
                }
                else {
                    languageTranslator.translate(translateParams)
                    .then(translationResult => {
                        console.log(JSON.stringify(translationResult, null, 2));
                        textToTranslate = translationResult.result.translations[0].translation;

                        resolve({
                            statusCode: 200,
                            body: {
                                translations: textToTranslate,
                                words: translationResult.result.word_count,
                                characters: translationResult.result.character_count,
                            },
                            headers: { 'Content-Type': 'application/json' }
                        });
                    })
                    .catch(err => {
                        console.log('error:', err);
                        resolve(getErrorResponse(err.result.message, defaultLanguage))
                    });
                }
                
            }

        } catch (err) {
            console.error('Error while initializing the AI service', err);
            resolve(getTheErrorResponse('Error while communicating with the language service', defaultLanguage));
        }
    });
}

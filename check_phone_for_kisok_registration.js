exports.handler = async function (context, event, callback) {
  var moment = require("moment");
  var axios = require("axios");

  let memory = JSON.parse(event.Memory);
  let phone =
    memory.twilio.collected_data.register.answers.phone.answer.trim() || "";
  if (!(phone && phone.length === 10)) {
    callback(null, {
      actions: [
        {
          collect: {
            name: "register",
            questions: [
              {
                question: {
                  say: "Please try again with a valid 10 digit phone number",
                },
                name: "phone",
              },
            ],
            on_complete: {
              redirect: {
                method: "POST",
                uri:
                  "https://telehealth-6174.twil.io/check_phone_for_kisok_registration",
              },
            },
          },
        },
      ],
    });
  }
  const clinicId = 1;
  const ENDPOINT_CODE =
    "nU1aGasDmcWiiLAZrNTIH71uBYTwug3HDaPQEasNPfsfavfEH2k8lA==";
  const ENDPOINT_CLIENT_ID = "stag";

  // Check if the phone is already registered

  try {
    const apiCallResponse = await axios.get(
      `https://mobilecheckinfunctions.azurewebsites.net/api/getpatientvisit/${clinicId}/${phone}?code=${ENDPOINT_CODE}&clientId=${ENDPOINT_CLIENT_ID}`
    );
    // Exist
    // Parse call number
    const parts = apiCallResponse.data.split("CallNumber: ");
    const callNumber = parts[1];
    const responseObject = {
      actions: [
        {
          say: `Your call number is ${callNumber}. Please be seated and someone will call you `,
        },
      ],
    };
    callback(null, responseObject);
  } catch (error) {
    // Doesn't exist
    callback(null, {
      actions: [
        {
          remember: {
            phone: phone,
          },
        },
        {
          collect: {
            name: "register",
            questions: [
              {
                question: {
                  say: "Thank you. Can I please know your firstname?",
                },
                name: "first_name",
              },
              {
                question: {
                  say: "And your lastname?",
                },
                name: "last_name",
              },
              {
                question: {
                  say: "Your date of birth? ",
                },
                name: "date",
                type: "Twilio.DATE",
              },
              {
                question: {
                  say:
                    "What will be your reason for visit? Please select one from the following options: 1) Blood Draw, 2) Urine Test Only, 3) Sample Drop Off and 4) Kit Pick Up Only",
                },
                name: "appointment_type",
                validate: {
                  allowed_values: {
                    list: [
                      "Blood Draw",
                      "Urine Test Only",
                      "Sample Drop Off",
                      "Kit Pick Up Only",
                    ],
                  },
                  on_failure: {
                    messages: [
                      {
                        say:
                          "Sorry, I didn't understand :(  Can you please try once again?",
                      },
                      {
                        say:
                          "Hmm, I'm not understanding. Here are the options you have: 1) Blood Draw, 2) Urine Test Only, 3) Sample Drop Off and 4) Kit Pick Up Only",
                      },
                    ],
                  },
                  max_attempts: {
                    redirect: "task://having-trouble",
                    num_attempts: 3,
                  },
                },
              },
            ],
            on_complete: {
              redirect: {
                method: "POST",
                uri: "https://telehealth-6174.twil.io/book_appointment",
              },
            },
          },
        },
      ],
    });
  }
};

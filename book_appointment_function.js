exports.handler = async function(context, event, callback) {
  var moment = require('moment');
  var axios = require('axios');

  const clinicId = 1;
  const ENDPOINT_CODE =
    "nU1aGasDmcWiiLAZrNTIH71uBYTwug3HDaPQEasNPfsfavfEH2k8lA==";
  const ENDPOINT_CLIENT_ID = "stag";

let memory = JSON.parse(event.Memory)

let first_name = memory.twilio.collected_data.register.answers.first_name.answer || '';
let last_name = memory.twilio.collected_data.register.answers.last_name.answer || '';
let date = memory.twilio.collected_data.register.answers.date.answer || '';
let phone = memory.phone;
let appointment_type = memory.twilio.collected_data.register.answers.appointment_type.answer || '';

if (appointment_type.toLowerCase().indexOf('blood') > -1) {
  appointment_type = "bloodDraw";
} else if (appointment_type.toLowerCase().indexOf('urine') > -1) {
  appointment_type = "urineTestOnly";
} else if (appointment_type.toLowerCase().indexOf('drop') > -1) {
  appointment_type = "sampleDropOff";
} else if (appointment_type.toLowerCase().indexOf('kit') > -1) {
  appointment_type = "kitPickUpOnly";
}

const formattedPatientData = {
  FirstName: first_name,
  LastName: last_name,
  MobileNumber: phone,
  DOB: moment(date, "YYYY-MM-DD").format("MM/DD/YYYY"),
  VisitType: appointment_type,
  ClinicID: clinicId,
};

try {
  const apiCallResponse = await axios.post(
    `https://mobilecheckinfunctions.azurewebsites.net/api/patientvisit?code=${ENDPOINT_CODE}&clientId=${ENDPOINT_CLIENT_ID}`,formattedPatientData
  );
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
  const responseObject = {
    actions: [
      {
        say: `Sorry we are unable to process your request. Please try again`,
      },
    ],
  };
  callback(null, responseObject);
}
};
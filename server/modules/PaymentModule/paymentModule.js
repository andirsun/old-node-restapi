/******************************** INSTRUCTIONS************ */
/* This files makes all the request to payU and NEQUI servers*/
/* this functions are used by Pay u AND NEQUI endpoints ******/

//SIgner workd with AWS4 signer to build nequi body and headers request
const signer = require('./Nequi/utils/signer');
/* Urls from APIS*/
const NEQUI_SUBS_HOST = 'api.sandbox.nequi.com';
const NEQUI_SUBS_NEW_PATH = '/subscriptions/v1/-services-subscriptionpaymentservice-newsubscription';
const NEQUI_SUBS_GET_PATH = '/subscriptions/v1/-services-subscriptionpaymentservice-getsubscription';
const NEQUI_SUBS_AUTOMATIC_PAYMENT_PATH = '/subscriptions/v1/-services-subscriptionpaymentservice-automaticpayment';
const NEQUI_PUSH_HOST = 'api.sandbox.nequi.com';
const NEQUI_PUSH_SEND_PATH = '/payments/v1/-services-paymentservice-unregisteredpayment';
const NEQUI_PUSH_CHECK_PAYMENT_PATH='/payments/v1/-services-paymentservice-getstatuspayment';
const NEQUI_PUSH_CANCEL_PAYMENT_PATH='/payments/v1/-services-paymentservice-cancelunregisteredpayment';
const NEQUI_PUSH_REVERSE_PAYMENT_PATH=`/payments/v1/-services-reverseservices-reversetransaction`

const payUrl = 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi';
/* IMport axios to make request to server */
const axios = require('axios').default;

module.exports = {
  /*********************PAy U ************************************ */
  authAndCapture : function(payerIp, payerId, buyerId, productValue, currency, paymentMethod, reference, description, res){
    //A new payU request is created using the builders
    const builder = require('./PayU/paymentBuilder');
    var payUVO = builder.createPayURequest(payerIp, payerId, buyerId, productValue, currency, paymentMethod, reference, description);
    //It's sended using axios and the corresponding on response and on error handler functions
    var axios = require('axios');
    axios.post(payUrl, payUVO)
    .then((res) => {
        res.status(200).json({
            response : 2,
            content : response.data
        });
    }, (error) => {
        return res.status(500).json({
            response : 3,
            content : {
                error
            }
        });
    });
  },
  /********************* NEQUI ********************************** */
  nequiNewSubscription : function(phoneNumber, messageID, clientID, res){
    //Create a new nequiNewSubscription request using the builders and adding
    //information that its needed to be signed by aws4
    const builder = require('./Nequi/newSubscriptionBuilder');
    var newSubscription = builder.createNewSubscriptionRequest(phoneNumber,messageID, clientID);
    var headers = { 'content-type' : 'application/json' };
    var body = newSubscription.getRequest();
    //Request sended using the aws4 signer for Nequi
    signer.makeSignedRequest(NEQUI_SUBS_HOST, NEQUI_SUBS_NEW_PATH,'POST', headers, body,
      (statusCode, resp) => {
        //Do somenthing with the response
        let status="-1";
        let description="";
        let message = "REJECTED";
        var responseCode = 2;
        var token;
        if(resp.ResponseMessage){
          status = resp.ResponseMessage.ResponseHeader.Status.StatusCode;
          description = resp.ResponseMessage.ResponseHeader.Status.StatusDesc;
          if (status == "0"){
            message = "ACCEPTED";
            description = "Subscripción enviada exitosamente, confirmala en Nequi";
            token = resp.ResponseMessage.ResponseBody.any.newSubscriptionRS.token;
          }
        } else{
          message = "NEQUI_ERROR";
          responseCode = 3;
          description = "Un error ha ocurrido, intenta más tarde";
        }
        var response = {
          response : responseCode,
          content : {
            message : message,
            description : description,
            token : token
          }
        }
        //res.status(200).json(response);
        res.status(200).json(response);
      },
      (err) => {
        //Do somenthing with the error response
        var response = {
          response : 1,
          content : {
            message : "ERROR",
            description : "Hemos tenido un inconveniente, ¡Intentalo de nuevo!",
            err
          }
        }
        res.status(200).json(response);
      });
  },
  nequiGetSubscription : function(phoneNumber, token, res){
    //Create a new nequiGetSubscription request using the builders and adding
    //information that its needed to be signed by aws4
    const builder = require('./Nequi/getSubscriptionBuilder');
    var getSubscription = builder.createGetSubscriptionRequest(phoneNumber, token);
    var headers = { 'content-type' : 'application/json' };
    var body = getSubscription.getRequest();

    signer.makeSignedRequest(NEQUI_SUBS_HOST, NEQUI_SUBS_GET_PATH,'POST', headers, body,
      (statusCode, resp) => {
        let status="-1";
        let description="";
        let message = "REJECTED";
        var responseCode = 2;
        if(resp.ResponseMessage){
          status = resp.ResponseMessage.ResponseHeader.Status.StatusCode;
          description = resp.ResponseMessage.ResponseHeader.Status.StatusDesc;
          if (status=="0"){
            message="PENDING";
            description="Subscripción no confirmada";
            status = resp.ResponseMessage.ResponseBody.any.getSubscriptionRS.subscription.status;
            if(status=="1"){
              message="ACCEPTED";
              description="Subscripción activa actualmente";
            }
          }
        } else{
          message = "NEQUI_ERROR";
          responseCode = 3;
          description = "Un error ha ocurrido, intenta más tarde";
        }


        var response = {
          response : responseCode,
          content :{
            message : message,
            description : description
          }
        }
        res.status(200).json(response);
      },
      (err) => {
        //Do somenthing with the error response
        var response = {
          response : 1,
          content : {
            message : "ERROR",
            description : "Hemos tenido un inconveniente, ¡Intentalo de nuevo!",
            err
          }
        }
        res.status(200).json(response);
      });
  },
  nequiAutomaticPayment : function(phoneNumber, token, value, messageID, clientID, references, res){
    //Create a new nequiAutomaticPayment request using the builders and adding
    //information that its needed to be signed by aws4
    const builder = require('./Nequi/automaticPaymentBuilder');
    var automaticPayment = builder.createAutomaticPayment(phoneNumber,
      token, value, messageID, clientID, references);

    var headers = { 'content-type' : 'application/json' };
    var body = automaticPayment.getRequest();
    console.log(JSON.stringify(body));
    signer.makeSignedRequest(NEQUI_SUBS_HOST, NEQUI_SUBS_AUTOMATIC_PAYMENT_PATH,'POST', headers, body,
      (statusCode, resp) => {
        let status="-1";
        let description="";
        let message = "REJECTED";
        var responseCode = 2;
        if(resp.ResponseMessage){
          status = resp.ResponseMessage.ResponseHeader.Status.StatusCode;
          description = resp.ResponseMessage.ResponseHeader.Status.StatusDesc;
          if(status=="0"){
            message="ACCEPTED";
            description="Pago realizado con exito";
          }
        } else{
          message = "NEQUI_ERROR";
          responseCode = 3;
          description = "Un error ha ocurrido, intenta más tarde";
        }
        var response = {
          response : responseCode,
          content : {
            message : message,
            description : description
          }
        }
        res.status(200).json(response);
        //*/console.log(JSON.stringify(resp));
      },
      (err) => {
        //Do somenthing with the error response
        var response = {
          response : 1,
          content : {
            message : "ERROR",
            description : "Hemos tenido un inconveniente, ¡Intentalo de nuevo!",
            err
          }
        }
        res.status(200).json(response);
    });
  },
  nequiPushPayment : function(phoneNumber, value, messageID, clientID, references, res){
    const builder = require('./Nequi/pushPaymentBuilder');
    /* Create the Payment structure */
    var pushPayment = builder.createPushPaymentRequest(phoneNumber, value, messageID, clientID, references);
    var headers = { 'content-type' : 'application/json' };
    var body = pushPayment.getRequest();
    console.log(JSON.stringify(body));
    /* Make the request */
    signer.makeSignedRequest(NEQUI_PUSH_HOST, NEQUI_PUSH_SEND_PATH,'POST', headers, body,
      (statusCode, resp) => {
        let status="-1";
        let description="";
        let message = "REJECTED";
        let codeQR = undefined;
        var responseCode = 2;
        console.log("Respuesta al hacer crear el pago: ",JSON.stringify(resp));
        if ( resp.ResponseMessage ){
          status = resp.ResponseMessage.ResponseHeader.Status.StatusCode;
          description = resp.ResponseMessage.ResponseHeader.Status.StatusDesc;
          if ( status=="0" ) {
            message="ACCEPTED";
            description="Ya enviamos tu pago, confirmalo en Nequi";
            codeQR = resp.ResponseMessage.ResponseBody.any.unregisteredPaymentRS.transactionId;
          } /*else if (status=="1") {
            message="APPROVED";
            description="Listo, ¡realizaste tu compra exitosamente!";
          }*/
        } else {
          message = "NEQUI_ERROR";
          responseCode = 3;
          description = resp.message;
        }
        var response = {
          response : responseCode,
          content : {
            message : message,
            description : description,
            codeQR : codeQR
          }
        }
        res.status(200).json(response);
      },
      (err) => {
        //Do somenthing with the error response
        var response = {
          response : 1,
          content : {
            message : "ERROR",
            description : "Hemos tenido un inconveniente, ¡Intentalo de nuevo!",
          }
        }
        return res.status(200).json(response);
    });
  },
  nequiCheckPushPayment : async function(codeQR, messageID, clientID, res){
    const builder = require('./Nequi/checkPaymentBuilder');
    var checkPayment = builder.createCheckStatusPayment(codeQR, messageID, clientID);

    var headers = { 'content-type' : 'application/json' };
    var body = checkPayment.getRequest();

    signer.makeSignedRequest(NEQUI_PUSH_HOST, NEQUI_PUSH_CHECK_PAYMENT_PATH,
      'POST', headers, body,
      (statusCode, resp) => {
        //Do somenthing with the response
        let status="-1";
        let description="";
        let message = "REJECTED";
        var responseCode = 2;
        console.log("Respuesta al checkear el estado del pago: ",JSON.stringify(resp));
        if(resp.ResponseMessage){
          //console.log("testando la respuesta : ",JSON.stringify(resp))
          /* Cancelled order by User */          
          if( resp.ResponseMessage.ResponseHeader.Status.StatusCode == "10-455"){
            /* Make description with cancelation message */
            description = resp.ResponseMessage.ResponseHeader.Status.StatusDesc;
            /* Order expired time exceded minutes  */
          } else if( resp.ResponseMessage.ResponseHeader.Status.StatusCode == "10-454") {
            /* Description */
            description = resp.ResponseMessage.ResponseHeader.Status.StatusDesc;
          } else {
            /* Order Active */
            /* Status definition are gave by Nequi Conecta APi */
            status = resp.ResponseMessage.ResponseBody.any.getStatusPaymentRS.status;
            /* Order Pending */
            if(status == "33"){
              message="ACCEPTED";
              description="Por favor, confirma tu pago en Nequi";
              /*Order Acepted by User */
            } else if (status == "35") {
              
              message = "APPROVED";
              description="Listo, ¡Validamos tu pago exitosamente!";
            }  
          }
          
        } else{
          message = "NEQUI_ERROR";
          responseCode = 3;
          description = "Un error ha ocurrido, intenta más tarde";
        }
        /* If the charge was proved then make a charge */
        if(message == "APPROVED"){
          let config = { 
            headers: {
              'Content-Type': 'application/json',
            },
          };
          let body ={
            idBarber: "5e418194e7925574c51aa362",
            amount : parseInt(resp.ResponseMessage.ResponseBody.any.getStatusPaymentRS.value),
            paymentId : resp.ResponseMessage.ResponseBody.any.getStatusPaymentRS.trnId,
            phoneBarber : parseInt(resp.ResponseMessage.ResponseBody.any.getStatusPaymentRS.phoneNumber)
          }
          let url = `https://sandboxv2.timugo.com/barber/payments/chargeBalance`;
          axios.post(url,body,config)
            .then(resp=>{
              if(resp.data.response == 2){
                var response = {
                  response : responseCode,
                  content : {
                    message : message,
                    description : description
                  }
                }
                res.status(200).json(response);
              }
            })
            .catch(err=>{
              console.log(err);
              var response = {
                response : 1,
                content : {
                  message : "Error al tratar de recargarle el saldo al barbero",
                  description : description,
                  err
                }
              }
              res.status(200).json(response);
            })
        
          }else {
          var response = {
            response : responseCode,
            content : {
              message : message,
              description : description
            }
          }
          res.status(200).json(response);
        }
      },
      (err) => {
        //Do somenthing with the error response
        var response = {
          response : 1,
          content : {
            message : "ERROR",
            description : "Hemos tenido un inconveniente, ¡Intentalo de nuevo!",
            err
          }
        }
        return res.status(200).json(response);
    });
  },
  nequiReversePushPayment : function(phoneNumber, value, messageID, clientID, res){
    const builder = require('./Nequi/reversePushPaymentBuilder');
    /* Create the Payment structure */
    var pushPayment = builder.reversePushPaymentRequest(phoneNumber, value, messageID, clientID);
    var headers = { 'content-type' : 'application/json' };
    var body = pushPayment.getRequest();
    //console.log(JSON.stringify(body));
    /* Make the request */
    signer.makeSignedRequest(NEQUI_PUSH_HOST, NEQUI_PUSH_REVERSE_PAYMENT_PATH,'POST', headers, body,(statusCode, resp) => {
      /* Defaulta Values */
      let status="-1";
      let description="";
      let message = "REJECTED";
      var responseCode = 2;
      console.log("Response del peticion reverso: ",JSON.stringify(resp));
      if ( resp.ResponseMessage ){
        status = resp.ResponseMessage.ResponseHeader.Status.StatusCode;
        description = resp.ResponseMessage.ResponseHeader.Status.StatusDesc;
        if ( status=="0" & description=="SUCCESS") {
          message="APPROVED";
          description="Se reverso el pago correctamente.";
        }
      } else {
        message = "NEQUI_ERROR";
        responseCode = 3;
        description = resp.message;
      }
      var response = {
        response : responseCode,
        content : {
          message : message,
          description : description,
          codeQR : codeQR
        }
      }
      res.status(200).json(response);
    },
    (err) => {
      //Do somenthing with the error response
      var response = {
        response : 1,
        content : {
          message : "ERROR",
          description : "Hemos tenido un inconveniente, ¡Intentalo de nuevo!",
        }
      }
      return res.status(200).json(response);
    });


  }
}


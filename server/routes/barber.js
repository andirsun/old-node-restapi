const express = require("express");
const bcrypt = require("bcrypt");
const _ = require("underscore");
const Barber = require("../models/barber");
const jwt = require("jsonwebtoken");
const app = express();
const user = require("../models/user");
const order = require("../models/orderHistory");
//const moment = require('moment');
const moment = require('moment-timezone');
const service = require("../models/service")
const temporalOrder = require("../models/temporalOrder");

/////////////////////////////////

app.post("/loginBarber" ,function(req,res){
  
  let body = _.pick(req.body, ["phone"]);
  //let body = req.query;
  Barber.findOne({phone: body.phone},function(err, user) {
      if (err) {
        return res.status(500).json({
          response: 3,
          content: {
            error: err,
            message: "Error al buscar el barbero"
          }
        });
      }
      if (user) {
        //in case that the barber exists in de data base
        let barber = user.toJSON(); //handling theresponse
        temporalOrder.findOne({idBarber:barber.id},function(err,response){
          if (err) {
            return res.status(500).json({
              response: 3,
              content: {
                error: err,
                message: "Error al buscar si un barbero tiene un pedido en curso"
              }
            });
          }
          if(response){
            res.status(200).json({
              response: 2,
              content:"Barbero logeado, pero con pedido en curso"
            });    
          }else{
            res.status(200).json({
              response: 2,
              content:"Barbero logeado correctamente"
            });
          }
        });
       
      } else {
        res.json({
          response: 1,
          content:
            "Ups, no encontramos ningun barbero con ese Celular"
        });
      }
    }
  );

});
app.get("/getAvailableOrdersByCity",function(req,res){
  let city = req.query.city || "none";
  console.log(city);
  temporalOrder.find({city:city},function(err,response){
    if (err) {
      return res.status(400).json({
        response: 3,
        content: err
      });
    }
    if(response.length!=0){
      res.status(200).json({
        response: 2,
        content:response 
      });
    }else{
      res.status(200).json({
        response: 1,
        content: "Ups, no hay ordenes disponibles en esa ciudad"
      });
    }
  });
});
app.post("/finishOrder",function(req,res){
  let body = req.body;
  let idOrder = parseInt(body.idOrder);
  let nameBarber = body.nameBarber;
  let comment = body.comment || "Sin comentarios";
  let status = body.status;
  temporalOrder.findOneAndUpdate({id:idOrder},{status:false},function(err,temporalOrderDB){
    if (err) {
      return res.status(500).json({
        response: 1,
        content: err
      });
    }
    if(temporalOrderDB){
      let tempOrder = temporalOrderDB.toJSON();
      Barber.findOneAndUpdate({id:tempOrder.idBarber},{$inc:{points:50}},function(err,barberDb){//updating points to a barber
        if (err) {
          return res.status(500).json({
            response: 3,
            content: err
          });
        }
        if(barberDb){
          console.log("se sumaron los puntos al barbero");
        }else{
          console.log("No se le sumaron los puntos al barbero");
        }
      });
      user.findOneAndUpdate({id:tempOrder.idClient},{$inc:{points:50}},function(err,userDb){//updating points to a barber
        if (err) {
          return res.status(500).json({
            response: 3,
            content: err
          });
        }
        if(userDb){
          console.log("Se sumaron los punto al usuario");
        }else{
          console.log("No se le sumaron los puntos al usuario");
        }
      });
      order.find(function(err,ordersDB){
        if (err) {
          return res.status(500).json({
            response: 1,
            content: err
          });
        }
        if(ordersDB){ 
          
          service.findOne({id:tempOrder.typeService},function(err,response){
            if (err) {
              return res.status(500).json({
                response: 1,
                content: err
              });
            }
            if(response){
              let service = response.toJSON();
              let orderSave = new order({
                id : ordersDB.length + 1,
                idClient : tempOrder.idClient,
                idBarber: tempOrder.idBarber,
                nameBarber : nameBarber,
                nameClient : tempOrder.nameClient,
                address: tempOrder.address,
                dateBeginOrder : tempOrder.dateBeginOrder + " "+tempOrder.hourStart,
                dateFinishOrder : moment().tz('America/Bogota').format("YYYY-MM-DD HH:mm"),
                duration : 15,
                comments : comment,
                price : service.price,
                typeService : tempOrder.typeService,
                status: status,
                payMethod:"cash",
                city: tempOrder.city,
                bonusCode: "none",
                card: "none"
              });
              orderSave.save((err,orderDb)=>{
                if (err) {
                  return res.status(500).json({
                    response: 1,
                    content: err
                  });
                }
                if(orderDb){
                  res.status(200).json({
                    response: 2,
                    content:{
                      orderDb,
                      message: "Se guardo la orden en el historial y se desactivo de las ordenes activas"
                    } 
                  });
                }else{
                  res.status(200).json({
                    response: 1,
                    content:{
                      message: "UPss. NO pudimos enviar la orden al historial"
                    } 
                  });
                }    
              });
            }else{
              res.status(200).json({
                response: 1,
                content:{
                  message: "No se pudo obtener el precio del servicio con el id dado"
                } 
              });    
            }
          });
        }else{
          res.status(200).json({
            response: 1,
            content:{
              message: "NO SE PUDIERON ENCONTRAR LAS ORDENES"
            } 
          });
        }
      });
    }else{
      res.status(200).json({
        response: 1,
        content:{
          message: "Upss. No concontramos esa orden"
        } 
      });
    }
  });
});
app.post("/addBarber", function(req, res) {
  ///Add user to DB the data is read by body of the petition
  let body = req.body;
  Barber.find(function(err, barberDB) {
    if (err) {
      return res.status(400).json({
        response: 1,
        content: err
      });
    }
    let id = barberDB.length + 1; //para que es id sea autoincrementable
    let name = body.name;
    let lastName = body.lastName;
    let address = body.address;
    let email = body.email;
    let birth = body.birth;
    let phone = body.phone;
    let city = body.city;
    let pass = bcrypt.hashSync(body.pass, 10);
    let document = body.document;
    let bio = body.bio || "";
    let barberSave = new Barber({
      id: id,
      name: name,
      lastName: lastName,
      address: address,
      email: email,
      birth: birth,
      phone: phone,
      password: pass,
      city,
      document: document,
      bio: bio
    });

    barberSave.save((err, barberDB) => {
      //callback que trae error si no pudo grabar en la base de datos y usuarioDB si lo inserto
      if (err) {
        return res.status(400).json({
          response: 1,
          content: err
        });
      }
      barberDB.password = null;
      res.status(200).json({
        response: 2,
        content: {
          barber: barberDB,
          message: "Barber registered !!!"
        }
      });
    });
  });
});

module.exports = app;

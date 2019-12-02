const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

let validMethodTypes = {
  values: ["cash", "creditCard", "debitCard", "BonusCode"],
  message: "{VALUE} no es un metodo de pago valido"
};
let Schema = mongoose.Schema;

let temporalOrder = new Schema({
  id: {
    type: Number,
    require: [true, "EL id es necesario"],
    default: 0
  },
  idClient: {
    type: Number,
    required: [true, "El id del cliente es necesario"]
  },
  idBarber: {
    type: Number,
    required: [false]
  },
  address: {
    type: String,
    required: [true,"la direccion es necesaria"]
  },
  dateBeginOrder: {
    type: Date,
    required: [true, "La fecha de inicio del pedido es necesaria"]
  },
  dateFinishOrder: {
    type: Date,
    required: [false]
  },
  typeService: {
    type: Number,
    required: [true, "El tipo de servicio es necesario"]
  },
  status: {
    type: Boolean,
    default: true,
    required: [false]
  }
  
});

temporalOrder.methods.toJSON = function() {
  let order = this;
  let orderObject = order.toObject();
  //delete orderObject.card;
  return orderObject;
};

temporalOrder.plugin(uniqueValidator, { message: "{PATH} debe de ser único" });

module.exports = mongoose.model("TemporalOrder", temporalOrder);
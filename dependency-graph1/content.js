
var exampleNodes = [
  {"type":"Package","id":"p1","parent":null,"name":"Package","full_name":"com.hotelrapp"},
  
  {"type":"Class","id":"c1","parent":"p1","number":"101","name":"Class_1","full_name":"com.hotelrapp.Class_1"},
  {"type":"Class","id":"c2","parent":"p1","number":"101","name":"Class_2","full_name":"com.hotelrapp.Class_2"},
  {"type":"Class","id":"c3","parent":"p1","number":"101","name":"Class_3","full_name":"com.hotelrapp.Class_3"},
  
  {"type":"Method","id":"c1_m1","parent":"c1","number":"101","name":"Class_1:method_1()","full_name":"com.hotelrapp.Class_1:method_1()"},
  {"type":"Method","id":"c1_m2","parent":"c1","number":"101","name":"Class_1:method_2()","full_name":"com.hotelrapp.Class_1:method_2()"},
  {"type":"Method","id":"c1_m3","parent":"c1","number":"101","name":"Class_1:method_3()","full_name":"com.hotelrapp.Class_1:method_3()"},
  
  {"type":"Method","id":"c2_m1","parent":"c2","number":"101","name":"Class_2:method_1()","full_name":"com.hotelrapp.Class_2:method_1()"},
  {"type":"Method","id":"c2_m2","parent":"c2","number":"101","name":"Class_2:method_2()","full_name":"com.hotelrapp.Class_2:method_2()"},
  {"type":"Method","id":"c2_m3","parent":"c2","number":"101","name":"Class_2:method_3()","full_name":"com.hotelrapp.Class_2:method_3()"},
  
  {"type":"Method","id":"c3_m1","parent":"c3","number":"101","name":"Class_3:method_1()","full_name":"com.hotelrapp.Class_3:method_1()"},
  {"type":"Method","id":"c3_m2","parent":"c3","number":"101","name":"Class_3:method_2()","full_name":"com.hotelrapp.Class_3:method_2()"},
  {"type":"Method","id":"c3_m3","parent":"c3","number":"101","name":"Class_3:method_3()","full_name":"com.hotelrapp.Class_3:method_3()"}
]

var exampleLinks = [
  {"source":"c1_m2", "target":"c3_m1", "value":Math.floor(Math.random() * 100)},
  {"source":"c1_m3", "target":"c3_m2", "value":Math.floor(Math.random() * 100)},
  {"source":"c2_m1", "target":"c1_m2", "value":Math.floor(Math.random() * 100)},
  {"source":"c2_m1", "target":"c3_m3", "value":Math.floor(Math.random() * 100)},
  {"source":"c3_m2", "target":"c2_m3", "value":Math.floor(Math.random() * 100)}  
]



var exampleNodes = [
  {"type":"Class","id":"c3","parent":null,"number":"163","name":"java.lang.Exception","full_name":"java.lang.Exception"}, 
  {"type":"Class","id":"ItemNotFoundException","parent":null,"number":"164","name":"ItemNotFoundException","full_name":"ItemNotFoundException"},   
  {"type":"Method","id":"m3","parent":"c3","number":"35","name":"<init>","full_name":"java.lang.Exception:<init>"}, 
  {"type":"Method","id":"m4","parent":"ItemNotFoundException","number":"60","name":"<init>","full_name":"ItemNotFoundException:<init>"}
]

var exampleLinks = [
  {"source":"m4", "target":"m3", "value":-1}
]










var exampleNodes = [
  {"type":"Package","id":"p1","parent":null,"name":"Package","full_name":"com.hotelrapp"},
  {"type":"Class","id":"c1","parent":"p1","number":"101","name":"Class_1","full_name":"com.hotelrapp.Class_1"},
  {"type":"Class","id":"c2","parent":"p1","number":"101","name":"Class_2","full_name":"com.hotelrapp.Class_2"},
  {"type":"Class","id":"c3","parent":"p1","number":"101","name":"Class_3","full_name":"com.hotelrapp.Class_3"},
  {"type":"Method","id":"c1_m1","parent":"c1","number":"101","name":"Class_1:method_1()","full_name":"com.hotelrapp.Class_1:method_1()"},
  {"type":"Method","id":"c1_m2","parent":"c1","number":"101","name":"Class_1:method_2()","full_name":"com.hotelrapp.Class_1:method_2()"},
  {"type":"Method","id":"c1_m3","parent":"c1","number":"101","name":"Class_1:method_3()","full_name":"com.hotelrapp.Class_1:method_3()"},
  {"type":"Method","id":"c2_m1","parent":"c2","number":"101","name":"Class_2:method_1()","full_name":"com.hotelrapp.Class_2:method_1()"},
  {"type":"Method","id":"c2_m2","parent":"c2","number":"101","name":"Class_2:method_2()","full_name":"com.hotelrapp.Class_2:method_2()"},
  {"type":"Method","id":"c2_m3","parent":"c2","number":"101","name":"Class_2:method_3()","full_name":"com.hotelrapp.Class_2:method_3()"},
  {"type":"Method","id":"c3_m1","parent":"c3","number":"101","name":"Class_3:method_1()","full_name":"com.hotelrapp.Class_3:method_1()"},
  {"type":"Method","id":"c3_m2","parent":"c3","number":"101","name":"Class_3:method_2()","full_name":"com.hotelrapp.Class_3:method_2()"},
  {"type":"Method","id":"c3_m3","parent":"c3","number":"101","name":"Class_3:method_3()","full_name":"com.hotelrapp.Class_3:method_3()"}
]

var exampleLinks = [
  {"source":"c1_m2", "target":"c3_m1", "value":Math.floor(Math.random() * 100)},
  {"source":"c1_m3", "target":"c3_m2", "value":Math.floor(Math.random() * 100)},
  {"source":"c2_m1", "target":"c1_m2", "value":Math.floor(Math.random() * 100)},
  {"source":"c2_m1", "target":"c3_m3", "value":Math.floor(Math.random() * 100)},
  {"source":"c3_m2", "target":"c2_m3", "value":Math.floor(Math.random() * 100)}  
]
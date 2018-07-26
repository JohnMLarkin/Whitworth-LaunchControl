const dataTypes = [['uint8','char',1,'0 .. 255'],
  ['int8','signed char',1,'-128 .. 127'],
  ['uint16','unsigned short',2,'0 .. 65,535'],
  ['int16','short',2,'-32,768 .. 32,767'],
  ['uint32','unsigned int',4,'0 .. 4,294,967,295'],
  ['int32','int',4,'-2,147,483,648 .. 2,147,483,647'],
  ['float','float',4,'-3.4E38 .. 3.4E38'],
  ['double','double',8,'-1.7E308 .. 1.7E308']
];

module.exports = dataTypes;

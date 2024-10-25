// 1. 설치한 모듈 및 사용할 함수 불러오기, 저장 위치 정의하기
const winston = require("winston");
const winstonDaily = require("winston-daily-rotate-file");
const appRoot = require("app-root-path");
const { createLogger } = require("winston");
const process = require("process"); // 프로그램과 관련된 정보를 나타내는 객체 모듈

const logDir = `${appRoot}/logs`; // logs 디렉토리 하위에 로그 파일 저장

const { combine, timestamp, label, printf } = winston.format; // winston.format의 내부 모듈을 가져옴

// 2-1. 로그 출력 포맷 정의, printf : 실제 출력 양식
const logFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`; 
    // timestamp : 시간, label : 시스템 네임, level : 정보, 에러, 경고 인지 구분, message :개발자가 남긴 로그 메세지
});

// 2-2. logger 생성
const logger = createLogger({ 
    format: combine(label({ label: "NODE_PROJECT" }), timestamp(), logFormat), 
    // 포맷 종류에는 simple과 combine 있음, winston이용시에는 combine을 주로 인용
    transports: [
        new winstonDaily({ // log 파일 설정
          level: "info", // 심각도
          datePattern: "YYYY-MM-DD", // 날짜포맷방식
          dirname: logDir, // 디렉토리 파일 이름 설정
          filename: "%DATE%.log", // 파일이름 설정, %DATE% - 자동으로 날짜가 들어옴
          maxSize: "20m", // 로그파일 크기, 정의하지 않으면 데이터가 쌓이고, 제안하면 초과시 앞의 데이터를 지움
          maxFiles: "30d", // 최근 30일치 로그 파일만 보관
        }),
        new winstonDaily({ // 로그 파일 설정
          level: "error", // 심각도
          datePattern: "YYYY-MM-DD",
          dirname: logDir, // 디렉토리 파일 이름 설정
          filename: "%DATE%.error.log", // 파일이름 설정, 에러파일을 구분해 별도보관
          maxSize: "20m", // 로그파일 크기
          maxFiles: "30d", // 최근 30일치 로그 파일만 보관
        }),
      ],
});

// 3. 개발 환경일 경우, 터미널에서도 로그를 확인할 수 있도록 추가 설정(process 모듈 사용)
if (process.env.NODE_ENV != "prod") { // NODE_ENV환경 설정가능, 환경이 prod가 아닐 경우(개발환경일 경우), process 모듈을 통해 터미널 창에 로그를 확인할 수 있도록 설정
    logger.add(
    new winston.transports.Console({
        format: winston.format.combine(
        winston.format.colorize(), // 로그 출력시 구분할 수 있도록 색상 추가
        winston.format.simple() // 메세지 형태를 단순하게 설정, prod이 아닐 경우 폴더와 터미널창에서 로그를 확인할 수 있도록
        ),
    })
    );
}

// 4. logger 내보내기
module.exports = logger;
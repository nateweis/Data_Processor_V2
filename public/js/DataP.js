

export const dp = ['$http','$window', '$scope', 'DataProcessingService', function($http, $window, $scope, DataProcessingService){
    const ctrl = this; 
    
    this.currentSelected = 0;
    this.filterSystem = {customer_id:0};
    this.finalProcessedObject = {}
    this.selectedSystem = {}
    this.selectedPastData = {}
    this.allPastData = []
    this.pastDataArr = []
    this.sytemsArr = []
    this.contactEmailList = []
    this.editSystemObj = {name:false, company: false, address: false, contact: false}
    $scope.pumps = {
        type: "other"
    };
   
    $window.onload = () => {
        $http({method:'GET', url: 'http://localhost:3005/system'})
        .then(res => {
            this.sytemsArr = res.data.pulledData;
            
            $http({method:'GET', url:'/data'})
            .then(data => ctrl.pastDataArr = data.data.pulledData)
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    }

    // ================================== //
    //       New Customer Submit          //
    // ================================== // 
    this.addNewSystem = () => {
        let topId = 0, arrStr = "{"

        ctrl.sytemsArr.forEach(sys => {if(sys.id > topId) topId = sys.id})
        topId++

        for(let i =0; i < ctrl.contactEmailList.length; i++){
            i === 0 ? arrStr += ctrl.contactEmailList[i] : arrStr += `,${ctrl.contactEmailList[i]}`
        }

        const obj = {
            id: topId,
            name: ctrl.newSysName,
            company: ctrl.newSysCompany,
            contacts: arrStr + "}",
            address: ctrl.newSysAddress
        }
        $http({method:'POST', url:'/system', data: obj})
        .then(data => console.log(data))
        .catch(err => console.log(err))
        undoSysForm()
    }
    this.addNewSystemContact = () => {
        if(ctrl.newSysEmail.length > 3){
            this.contactEmailList.push(ctrl.newSysEmail)
            ctrl.newSysEmail = ""
        }
        
    }
    const undoSysForm = () => {
        ctrl.newSysName = "";
        ctrl.newSysCompany ="";
        ctrl.newSysAddress ="";
        ctrl.newSysEmail ="";
        ctrl.contactEmailList = [];
    }
    this.removeFromEmailContacts = (str) => {
        const i = ctrl.contactEmailList.indexOf(str)
        ctrl.contactEmailList.splice(i, 1)
    }

    // ================================== //
    //          Edit Customer             //
    // ================================== // 
    this.editSystem = (key) => {
        console.log(key)
    }

    // ================================== //
    //          Helper Functions          //
    // ================================== // 
    const amountofDays = (excel) => {
        let firstDay = '', lastDate = '', startingIndex = 0;
        for(let i = 0; i < excel.length; i++){
            const k = Object.keys(excel[i])
            if(k.length > 5){
                startingIndex = i + 1;
                break;
            }
        }
        firstDay = parseInt(excel[startingIndex]['Date'].split(" ")[1]);
        lastDate = parseInt(excel[excel.length- 1]['Date'].split(" ")[1]);
        
        return lastDate - firstDay + 1
    }
    // Converst secondst to time in an obj
    const convertFromSecs = (time) => {
        let sec = 0, min= 0, hr = 0
        for(let i = 0; i < time; i++){
            sec++
            if(sec >= 60) {
                sec = 0
                min++
                if(min >= 60){
                    min = 0
                    hr++
                }
            }
        }
        return {h: hr, m: min, s: sec}
    }

    

    // ****************************** END OF HELPER fUNCTIONS FUNCTION **************************************** ///

    // extender for the excel file processing 
    this.excelFileProcessing = function(excelFile){
        ctrl.finalProcessedObject = {}
        const rows = excelFile
        const dateArr = excelFile[0]["Date"].split(" ")
        
        const k = Object.keys(rows[0]).length >= Object.keys(rows[rows.length -1]).length ? 0 : rows.length -1 //in case the first cell is missing keys
        let rawKeys = Object.keys(rows[k]);
        let sk = []
        for(let i =0; i< rawKeys.length; i++){
            const temp = rawKeys[i].split("\\")
            const last = temp.length -1
            sk.push(temp[last])
        }
        if(sk.indexOf("High Pressure Fault") > 0) $scope.pumps.type = "Booster"
        else if(sk.indexOf("Over Temp Fault") > 0) $scope.pumps.type = "Condensate"
        else if(sk.indexOf("Low Level Alarm") > 0) $scope.pumps.type = "TankFill"
        else $scope.pumps.type = "Sewer"

        let tempFilterArr = [] // get all the past data from that location of that system type
        ctrl.allPastData.forEach(sys => {if($scope.pumps.type === sys.type) tempFilterArr.push(sys)})

        
        if($scope.pumps.type === "Booster") ctrl.processSleep(rows)
        if($scope.pumps.type === "Condensate") ctrl.processTemp(rows)
        ctrl.processAlarms(rows)
        ctrl.processRuntimes(rows) 
        
        // console.log(ctrl.finalProcessedObject)
        ctrl.finalProcessedObject.amountOfDaysRunning = amountofDays(rows)
        ctrl.finalProcessedObject.date = dateArr[0] + " " + dateArr[2]
        ctrl.finalProcessedObject = {...ctrl.finalProcessedObject, ...$scope.pumps}
        const avergedPastData = makeAvrgPastData(tempFilterArr)
        DataProcessingService.activateMakePdf([ctrl.finalProcessedObject, ctrl.selectedSystem, ctrl.selectedPastData, tempFilterArr, avergedPastData, convertFromSecs])
        console.log(ctrl.finalProcessedObject)
    }
    

    // ================================== //
    //     Filtering the System Data      //
    // ================================== // 

    this.filterSystemData = () => {
        ctrl.selectedPastData = {};
        if(ctrl.system) {
            const ssys = JSON.parse(ctrl.system);
            ctrl.selectedSystem = ssys;
            ctrl.filterSystem.customer_id = ctrl.selectedSystem.id;

            let temp = []
            ctrl.pastDataArr.forEach(sys => {
                if(ctrl.filterSystem.customer_id === sys.customer_id)temp.push(sys)
            })
            ctrl.allPastData = temp

        }
    }

    // ================================== //
    //     Make an Avrg of Past Data      //
    // ================================== // 

    const makeAvrgPastData = (arr) => {
        const organicAdd = ['Fault', 'Alarm', 'Start', 'Starts', 'bothRunningCount', 'sleepCount', 'avgTemp', 'maxTemp', 'minTemp', 'amountOfDaysRunning'];
        const timeAdd = ['Avrage', 'Total', 'sleepTimeTotal']
        let numberOfData = 0, averagedObj = {}, keys = [];

        arr.forEach(pastData => {
            const currentPD = JSON.parse(pastData.data)
            if(currentPD.date !== ctrl.finalProcessedObject.date){
                numberOfData++
                if(keys.length <= 1){
                    averagedObj = currentPD;
                    keys = Object.keys(currentPD)
                }
                else{
                    keys.forEach(key => {
                        let keyWord = key.split(" ")[key.split(" ").length - 1];
                        for(let i = 0; i < organicAdd.length; i++) if(keyWord === organicAdd[i]) averagedObj[key] += currentPD[key] //adding the ints together

                        for(let i = 0; i < timeAdd.length; i++){ //adding the time objs together 
                            if(keyWord === timeAdd[i]){
                                averagedObj[key].m = parseInt(averagedObj[key].m)
                                averagedObj[key].s = parseInt(averagedObj[key].s)

                                averagedObj[key].h += currentPD[key].h
                                averagedObj[key].m += parseInt(currentPD[key].m)
                                averagedObj[key].s += parseInt(currentPD[key].s)
                            }
                        }  

                    })
                }
            }
        })

        keys.forEach(key => { //turning the combined numbers into avrages
            let keyWord = key.split(" ")[key.split(" ").length - 1];
            for(let i = 0; i < organicAdd.length; i++) if(keyWord === organicAdd[i]) averagedObj[key] = Math.round(averagedObj[key] / numberOfData)
            for(let i = 0; i < timeAdd.length; i++){
                if(keyWord === timeAdd[i]){
                    averagedObj[key].h = Math.round(averagedObj[key].h / numberOfData)
                    averagedObj[key].m = Math.round(averagedObj[key].m / numberOfData)
                    averagedObj[key].s = Math.round(averagedObj[key].s / numberOfData)
                }
            }
        })
        return averagedObj
    }


    // ================================== //
    //     Procssing The Alarm Data       //
    // ================================== // 

    this.processAlarms = function(rows){
        const k = Object.keys(rows[0]).length >= Object.keys(rows[rows.length -1]).length ? 0 : rows.length -1 //in case the first cell is missing keys
        let rawKeys = Object.keys(rows[k]);
        let indexHolder = [];
        
        //*** Making an Array of Relvent Variables ***
        for (let i = 0; i < rawKeys.length; i++) { // finding the keys we want 
            const sk1 = rawKeys[i].split("\\") // sK stands for split keys 
            const sk2 = sk1[sk1.length - 1].split(" ")
            if(sk2[sk2.length - 1] === "Fault" || sk2[sk2.length - 1] === "Alarm" || sk2[sk2.length - 1] === "Start") { //making an obj to push into our array 
                const obj = {
                    type: sk1[sk1.length - 1],
                    index: i
                }
                const sk3 = sk1[sk1.length - 2]
                if(sk3.split(" ")[1] === "1" || sk3.split(" ")[1] === "2") obj.type = sk3 + " "+ sk1[sk1.length - 1]
                
                indexHolder.push(obj)//push into the array 
            }
        }

        // *** Using the Array of relevent Variables to make an obj of counted faults ****

        const countObj = {} // an object to hold the number count 
        indexHolder.forEach(v => { // looping throught both the the relevent indexes and the actual excel rows 
            countObj[v.type] = 0
            for (let i = 0; i < rows.length; i++) {
                if(parseInt(rows[i][rawKeys[v.index]]) === 1){
                    if(i === 0) countObj[v.type] += 1
                    else if(parseInt(rows[i-1][rawKeys[v.index]]) !== 1) countObj[v.type] += 1
                }
            }
             // 
        });

        ctrl.finalProcessedObject = {...ctrl.finalProcessedObject, ...countObj}
        
    }
    
    // ****************************** END OF PROCESS ALARMS FUNCTION **************************************** ///



    // ================================== //
    //    Procssing The Runtime Data      //
    // ================================== // 
    this.processRuntimes = (rows) => {
        const k = Object.keys(rows[0]).length >= Object.keys(rows[rows.length -1]).length ? 0 : rows.length -1 //in case the first cell is missing keys
        let rawKeys = Object.keys(rows[k]);
        let indexHolder = [];
        
        //*** Making an Array of Relvent Variables ***
        for (let i = 0; i < rawKeys.length; i++) {
            const sK = rawKeys[i].split("\\") // sK stands for split keys 
            // console.log(sK[sK.length - 1])
            if(sK[sK.length - 1] === "Run" || sK[sK.length - 1] === "Running") { //making an obj to push into our array 
                const obj = {
                    index: i
                }
                obj.type = sK[sK.length - 1] === "Time" ? sK[sK.length - 1] : sK[sK.length - 2] + " "+ sK[sK.length - 1]
                indexHolder.push(obj)
            }
        }

        // *** Using the Array of relevent Variables to make an obj of runtimeinfo ****
        const runtimeObj = {} // an object to hold the number runtime info
        indexHolder.forEach(v => { // looping throught both the the relevent indexes and the actual excel rows 
            let pumpNumber = v.type
            const starts = pumpNumber === "Time" ? pumpNumber : pumpNumber += " Starts"
            pumpNumber = v.type
            const runTime = pumpNumber === "Time" ? pumpNumber : pumpNumber += " Time Raw"
            pumpNumber = v.type
            const rtTotal = pumpNumber === "Time" ? pumpNumber : pumpNumber += " Time Total"
            pumpNumber = v.type
            const rtAvrg = pumpNumber === "Time" ? pumpNumber : pumpNumber += " Time Avrage"
            
            runtimeObj[starts] = 0
            runtimeObj[runTime] = 0
            runtimeObj[rtTotal] = {h:0, m:0, s:0}
            runtimeObj[rtAvrg] = {h:0, m:0, s:0}
            for (let i = 0; i < rows.length; i++) {
                if(parseInt(rows[i][rawKeys[v.index]]) === 1 && v.type !== "Time"){  
                    if(i === 0){
                        runtimeObj[starts] += 1 // adding to pump 1/2 starts

                        if(rows[i+1] && parseInt(rows[i+1][rawKeys[v.index]]) === 0){ //if the next row is a 0 see how long pump was on for
                            const currentTime = rows[i]["Time"].split(":") //getting the times for current on and next time off
                            const nextTime = rows[i + 1]["Time"].split(":")
                            const toSecondsAr = [3600, 60, 1]
                            let num1 = 0, num2 = 0

                            for(let j=0; j < currentTime.length; j++){ //converting the times to seconds 
                                num1 += parseInt(currentTime[j]) * toSecondsAr[j]
                                num2 += parseInt(nextTime[j]) * toSecondsAr[j]
                            }

                            const sum = num2 >= num1 ? num2 - num1 : (86400 - num1) + num2 //subtracting the next time off from time on to see how long it was on for 
                            runtimeObj[runTime] += sum //getting the raw time data 
                            
                        }

                    }
                    else if(parseInt(rows[i-1][rawKeys[v.index]]) !== 1){ //if the row before does not equal 1 
                        runtimeObj[starts] += 1 // adding to pump 1/2 starts

                        const toSecondsAr = [3600, 60, 1]
                        const currentTime = rows[i]["Time"].split(":") //getting the times for current on and next time off
                        const currentDate = parseInt(rows[i]["Date"].split(" ")[1])  * 86400
                        
                        let nextTime, nextDate
                        for(let j = i; j < rows.length; j++){
                            if(rows[j] && parseInt(rows[j][rawKeys[v.index]]) === 0){
                                nextTime = rows[j]["Time"].split(":")
                                nextDate = parseInt(rows[j]["Date"].split(" ")[1]) * 86400
                                i = j
                                break;
                            }
                        }


                        if(nextTime){
                            let num1 = 0, num2 = 0

                            for(let j=0; j < currentTime.length; j++){ //converting the times to seconds 
                                num1 += parseInt(currentTime[j]) * toSecondsAr[j]
                                num2 += parseInt(nextTime[j]) * toSecondsAr[j]
                            }

                            num2 += nextDate;
                            num1 += currentDate
                            
                            const sum = num2 - num1 //subtracting the next time off from time on to see how long it was on for 
                            runtimeObj[runTime] += sum //getting the raw time data 
                        }
                            
                    } //end of else if 
                }
            }
            
            if(v.type !== "Time"){ //converting the raw seconds into min & hrs
                const avgSec = runtimeObj[runTime] / runtimeObj[starts] //getting the avarage runtime 
                runtimeObj[rtTotal] = convertFromSecs(runtimeObj[runTime])
                runtimeObj[rtAvrg] = convertFromSecs(avgSec)

                delete runtimeObj[runTime]
            }

        });

        delete runtimeObj["Time"]
        // console.log(runtimeObj)
        ctrl.finalProcessedObject = {...ctrl.finalProcessedObject, ...runtimeObj}
        
    }

    // ****************************** END OF PROCESS RUNTIME FUNCTION **************************************** ///





    // ================================== //
    //     Procssing The Sleep Data       //
    // ================================== // 

    this.processSleep = (rows) => {
        const k = Object.keys(rows[0]).length >= Object.keys(rows[rows.length -1]).length ? 0 : rows.length -1 //in case the first cell is missing keys
        let rawKeys = Object.keys(rows[k]);
        let indexHolder = [];

        //*** Making an Array of Relvent Variables ***
        for (let i = 0; i < rawKeys.length; i++) {
            const sK = rawKeys[i].split("\\") // sK stands for split keys 
            // console.log(sK[sK.length - 1])
            if(sK[sK.length - 1] === "Run") { //making an obj to push into our array 
                const obj = {
                    index: i,
                    type: sK[sK.length - 2]
                }
                indexHolder.push(obj)
            }
        }

        // *** Using the Array of relevent Variables to make an obj of sleep ****
        const sleepObj = { // an object to hold the number sleep info
            sleepCount: 0,
            sleepTimeRaw: 0,
            sleepTimeTotal: {h:0, m:0, s:0},
            bothRunningCount:0
        } 
        for(let i = 0; i < rows.length; i++){
            if(indexHolder[2]){ //sleep mode code if a triplex
                if(parseInt(rows[i][rawKeys[indexHolder[0].index]]) === 1 && parseInt(rows[i][rawKeys[indexHolder[1].index]]) === 1 && parseInt(rows[i][rawKeys[indexHolder[2].index]]) === 1){sleepObj.bothRunningCount +=1}
                if(parseInt(rows[i][rawKeys[indexHolder[0].index]]) === 0 && parseInt(rows[i][rawKeys[indexHolder[1].index]]) === 0 && parseInt(rows[i][rawKeys[indexHolder[2].index]]) === 0){
                    if(i === 0){sleepObj.sleepCount += 1}
                    else if(parseInt(rows[i -1][rawKeys[indexHolder[0].index]]) !== 0 || parseInt(rows[i -1][rawKeys[indexHolder[1].index]]) !== 0){ //if the previous row is not the same as this row add to the count and time
                        sleepObj.sleepCount += 1 // adding to the sleep count 
    
                        const toSecondsAr = [3600, 60, 1]
                        const currentTime = rows[i]["Time"].split(":") //getting the times for current sleep
    
                        let nextTime
                        for(let j = i; j < rows.length; j++){ // getting the time for next time its not is sleep 
                            if(rows[j] && (parseInt(rows[j][rawKeys[indexHolder[0].index]]) === 1 || parseInt(rows[j][rawKeys[indexHolder[1].index]]) === 1 || parseInt(rows[j][rawKeys[indexHolder[2].index]]) === 1)){
                                nextTime = rows[j]["Time"].split(":")
                                break;
                            }
                        }
    
                        if(nextTime){ // converting the time string to seconds and adding to the obj
                            let num1 = 0, num2 = 0
    
                            for(let j=0; j < currentTime.length; j++){ //converting the times to seconds 
                                num1 += parseInt(currentTime[j]) * toSecondsAr[j]
                                num2 += parseInt(nextTime[j]) * toSecondsAr[j]
                            }
                            
                            const sum = num2 >= num1 ? num2 - num1 : (86400 - num1) + num2 //subtracting the next time off from time on to see how long it was on for 
                            sleepObj.sleepTimeRaw += sum //getting the raw time data 
                        }
    
    
                    }
                }
            }
            else{ //sleep mode code if a duplex
                if(parseInt(rows[i][rawKeys[indexHolder[0].index]]) === 1 && parseInt(rows[i][rawKeys[indexHolder[1].index]]) === 1){sleepObj.bothRunningCount +=1}
                if(parseInt(rows[i][rawKeys[indexHolder[0].index]]) === 0 && parseInt(rows[i][rawKeys[indexHolder[1].index]]) === 0){
                    if(i === 0){sleepObj.sleepCount += 1}
                    else if(parseInt(rows[i -1][rawKeys[indexHolder[0].index]]) !== 0 || parseInt(rows[i -1][rawKeys[indexHolder[1].index]]) !== 0){ //if the previous row is not the same as this row add to the count and time
                        sleepObj.sleepCount += 1 // adding to the sleep count 
    
                        const toSecondsAr = [3600, 60, 1]
                        const currentTime = rows[i]["Time"].split(":") //getting the times for current sleep
    
                        let nextTime
                        for(let j = i; j < rows.length; j++){ // getting the time for next time its not is sleep 
                            if(rows[j] && (parseInt(rows[j][rawKeys[indexHolder[0].index]]) === 1 || parseInt(rows[j][rawKeys[indexHolder[1].index]]) === 1)){
                                nextTime = rows[j]["Time"].split(":")
                                break;
                            }
                        }
    
                        if(nextTime){ // converting the time string to seconds and adding to the obj
                            let num1 = 0, num2 = 0
    
                            for(let j=0; j < currentTime.length; j++){ //converting the times to seconds 
                                num1 += parseInt(currentTime[j]) * toSecondsAr[j]
                                num2 += parseInt(nextTime[j]) * toSecondsAr[j]
                            }
                            
                            const sum = num2 >= num1 ? num2 - num1 : (86400 - num1) + num2 //subtracting the next time off from time on to see how long it was on for 
                            sleepObj.sleepTimeRaw += sum //getting the raw time data 
                        }
    
    
                    }
                }
            }

        }

        sleepObj.sleepTimeTotal = convertFromSecs(sleepObj.sleepTimeRaw)
        delete sleepObj.sleepTimeRaw
        // console.log(sleepObj)
        ctrl.finalProcessedObject = {...ctrl.finalProcessedObject, ...sleepObj}
        
    }

    // ****************************** END OF PROCESS SLEEP FUNCTION **************************************** ///

    // ================================== //
    //    Processing Tempurature Data     //
    // ================================== //    

    this.processTemp = (rows) => {
        const k = Object.keys(rows[0]).length >= Object.keys(rows[rows.length -1]).length ? 0 : rows.length -1 //in case the first cell is missing keys
        let rawKeys = Object.keys(rows[k]);
        let tempIndex = 0;
        let totalTemp = 0;
        const tempObj = {
            avgTemp:0,
            minTemp: 0,
            maxTemp:0
        }

        for (let i = 0; i < rawKeys.length; i++) {
            const sK = rawKeys[i].split("\\") // sK stands for split keys 
            if(sK[sK.length - 1] === "Temperature") tempIndex = i
        }

        let min = parseInt(rows[0][rawKeys[tempIndex]]), max = parseInt(rows[0][rawKeys[tempIndex]])
        for(let i = 0; i < rows.length; i++){
            totalTemp += parseInt(rows[i][rawKeys[tempIndex]])
            if(parseInt(rows[i][rawKeys[tempIndex]]) > max) max = parseInt(rows[i][rawKeys[tempIndex]])
            if(parseInt(rows[i][rawKeys[tempIndex]]) < min) min = parseInt(rows[i][rawKeys[tempIndex]])
        }
        
        tempObj.avgTemp = parseInt(totalTemp / rows.length)
        tempObj.minTemp = min
        tempObj.maxTemp = max
        // console.log(tempObj)
        ctrl.finalProcessedObject = {...ctrl.finalProcessedObject, ...tempObj}
        
    }

    // ****************************** END OF PROCESS TEMPURATURE FUNCTION **************************************** ///

    // ================================== //
    //       Save the Processed Data      //
    // ================================== //  

    this.saveData = () => {
        const obj = {
            customer_id : ctrl.selectedSystem.id,
            type: ctrl.finalProcessedObject.type,
            data: JSON.stringify(ctrl.finalProcessedObject)
        }
        $http({method:'POST', url: '/data', data: obj})
        .then(res => alert(res.data.message))
        .catch(err => console.log(err))
    }

    // ================================== //
    //          Select Past Data          //
    // ================================== //  
    this.pastDataSelect = (data) => {
        console.log(JSON.parse(data.data))
        if(ctrl.currentSelected !== data.id){
            ctrl.selectedPastData = JSON.parse(data.data)
            ctrl.currentSelected = data.id
        }
        else{
            ctrl.selectedPastData = {};
            ctrl.currentSelected = 0;
        }
    }

    // ================================================================================================================================ //
    //                                     THIS IS THE START OF THE DATA PROCESSING PROCESS                                            //
    // ============================================================================================================================== //

    this.showFile = function(){
        const myFile = document.getElementById("fileBtn");
        // console.log(myFile.files[0])

        if(ctrl.system && myFile.files[0]){
            let reader = new FileReader()
            reader.readAsBinaryString(myFile.files[0])
            reader.onload = (e) => {
                let data = e.target.result
                let wb = XLSX.read(data, {type: "binary"})
                wb.SheetNames.forEach(sheet => {
                    let rowObj = XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheet])
                    // console.log(rowObj)
                    ctrl.excelFileProcessing(rowObj)
                    
                })
    
                // console.log(wb)
            }
        }
        else if(!myFile.files[0]) alert("Please Select A File")
        else if(!ctrl.system) alert("Please Select A System")

    }


}]
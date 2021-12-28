export const graph = ['$http', '$rootScope', '$timeout', function($http, $rootScope, $timeout){
    const ctrl = this;
    const positions = [6, 2, 1.2]
    const colors = ['#5e74b1', '#d97502', '#a8a5a5', '#33996a' ]
    const titles = ["Average", "Last Month", "This Month"]
    let pumpType = ""
    let secondsToTime = () => {}

    this.currentPumpData = {}
    this.pastPumpData = {}
    this.averagedPastData = {}
    this.allPastData = []

    $rootScope.$on('makePdf', (event, data)=> startPieGraph(data))

    const startPieGraph = (dataObj) => {
        ctrl.currentPumpData = dataObj[0];
        ctrl.pastPumpData = dataObj[2];
        ctrl.allPastData = dataObj[3]
        ctrl.averagedPastData = dataObj[4]
        secondsToTime = dataObj[5]

        pumpType = dataObj[0].type

        collectData()
    }

    const collectData = () => {
        let allStartPP = [], allStartAPD = [], st2SlComp = [], allRunPP = [], allRunAPD = [], allRunAPC = [], run2SlComp = [], allWaterTemps = []
        
        const pumpData = [
            ctrl.averagedPastData,
            ctrl.pastPumpData,
            ctrl.currentPumpData
        ]

    
        pumpData.forEach(obj =>{
            let startsPP = [], startsAPD = [], sleepCount = 0, sleepRunRaw = {}, sleepRunSecs = 0, waterTemp = []
            let fullHolderRunPP = {rawTime : [], data : [], hN : [], scale : []}
            let fullHolderRunAPD = {rawTime : [], data : [], hN : [], scale : []}
            let fullHolderRunAPC = {rawTime : [], data : [], hN : [], scale : []}
            let holderRun2SlComp = {rawTime : [], data : [], hN : [], scale : []}

            const currentKeys = Object.keys(obj)
            currentKeys.forEach(key =>{
                let checkStr = key.split(" ")[key.split(" ").length - 1];

                if(checkStr === 'Starts'){ //total starts & avg starts per day
                    startsPP.push(obj[key])
                    obj['amountOfDaysRunning']? startsAPD.push(Math.round(obj[key] / obj['amountOfDaysRunning'])) : startsAPD.push(Math.round(obj[key] / 30.4))
                }

                if(checkStr === 'sleepCount') sleepCount = obj[key] //starts 2 sleep 

                if(checkStr === 'sleepTimeTotal') { //run 2 sleep 
                    obj[key].h = parseInt(obj[key].h)
                    obj[key].m = parseInt(obj[key].m)
                    obj[key].s = parseInt(obj[key].s)

                    sleepRunSecs = (obj[key].h * 3600) + (obj[key].m * 60) + (obj[key].s)
                    sleepRunRaw = obj[key]
                } 

                if(checkStr === 'Total'){ 
                    //total runtime
                    let holderRunPP = {rawTime : {h:0, m:0, s:0}, data : 0, hN : 's', scale : 'sec'}
                    
                    obj[key].h = parseInt(obj[key].h)
                    obj[key].m = parseInt(obj[key].m)
                    obj[key].s = parseInt(obj[key].s)

                    if(obj[key].h > 0) holderRunPP.hN = 'h', holderRunPP.scale = 'hr'
                    else if(obj[key].m > 0) holderRunPP.hN = 'm', holderRunPP.scale = 'min'

                    holderRunPP.rawTime.h += obj[key].h
                    holderRunPP.rawTime.m += obj[key].m
                    holderRunPP.rawTime.s += obj[key].s

                    const num = (obj[key].h * 3600) + (obj[key].m * 60) + (obj[key].s)
                    holderRunPP.data += num

                    fullHolderRunPP.rawTime.push(holderRunPP.rawTime)
                    fullHolderRunPP.data.push(holderRunPP.data)
                    fullHolderRunPP.hN.push(holderRunPP.hN)
                    fullHolderRunPP.scale.push(holderRunPP.scale)

                    // Avrg Run Per Day
                    let holderRunAPD = {rawTime : {h:0, m:0, s:0}, data : 0, hN : 's', scale : 'sec'}
                    holderRunAPD.data = obj['amountOfDaysRunning'] ? num / obj['amountOfDaysRunning'] : num / 30.4 ;
                    holderRunAPD.rawTime = secondsToTime(holderRunAPD.data)

                    if(holderRunAPD.rawTime.h > 0) holderRunAPD.hN = 'h', holderRunAPD.scale = 'hr'
                    else if(holderRunAPD.rawTime.m > 0) holderRunAPD.hN = 'm', holderRunAPD.scale = 'min'

                    fullHolderRunAPD.rawTime.push(holderRunAPD.rawTime)
                    fullHolderRunAPD.data.push(holderRunAPD.data)
                    fullHolderRunAPD.hN.push(holderRunAPD.hN)
                    fullHolderRunAPD.scale.push(holderRunAPD.scale)
                }

                if(checkStr === 'Avrage'){
                    let holderRunAPC = {rawTime : {h:0, m:0, s:0}, data : 0, hN : 's', scale : 'sec'}
                    
                    obj[key].h = parseInt(obj[key].h)
                    obj[key].m = parseInt(obj[key].m)
                    obj[key].s = parseInt(obj[key].s)

                    if(obj[key].h > 0) holderRunAPC.hN = 'h', holderRunAPC.scale = 'hr'
                    else if(obj[key].m > 0) holderRunAPC.hN = 'm', holderRunAPC.scale = 'min'

                    holderRunAPC.rawTime.h += obj[key].h
                    holderRunAPC.rawTime.m += obj[key].m
                    holderRunAPC.rawTime.s += obj[key].s

                    const num = (obj[key].h * 3600) + (obj[key].m * 60) + (obj[key].s)
                    holderRunAPC.data += num

                    fullHolderRunAPC.rawTime.push(holderRunAPC.rawTime)
                    fullHolderRunAPC.data.push(holderRunAPC.data)
                    fullHolderRunAPC.hN.push(holderRunAPC.hN)
                    fullHolderRunAPC.scale.push(holderRunAPC.scale)
                }

                if(checkStr === 'avgTemp'){
                    waterTemp.push(obj['minTemp'])
                    waterTemp.push(obj['maxTemp'])
                    waterTemp.push(obj['avgTemp'])
                }

            })

            if(pumpType === "Booster"){
                let hN = 's', scale = 'sec'
                let runTotal = fullHolderRunPP.data.reduce((ttl, n) => {return ttl + n}, 0) //calc run 2 sleep comp
                const runTotalRaw = secondsToTime(runTotal)

                if(sleepRunRaw.h > 0) hN = 'h', scale = 'hr'
                else if(sleepRunRaw.m > 0) hN = 'm', scale = 'min'

                holderRun2SlComp.hN.push(hN)
                holderRun2SlComp.scale.push(scale)

                if(runTotalRaw.h > 0) hN = 'h', scale = 'hr'
                else if(runTotalRaw.m > 0) hN = 'm', scale = 'min'
                else hN = 's', scale = 'sec'

                holderRun2SlComp.hN.push(hN)
                holderRun2SlComp.scale.push(scale)
    
                holderRun2SlComp.data = [sleepRunSecs, runTotal]
                holderRun2SlComp.rawTime = [sleepRunRaw, runTotalRaw]
            }

            let startTotal = startsPP.reduce((ttl, n)=>{return ttl + n}, 0)
            
            allStartPP.push(startsPP)
            allStartAPD.push(startsAPD)
            st2SlComp.push([sleepCount, startTotal])
            allRunPP.push(fullHolderRunPP)
            allRunAPD.push(fullHolderRunAPD)
            allRunAPC.push(fullHolderRunAPC)
            run2SlComp.push(holderRun2SlComp)
            allWaterTemps.push(waterTemp)
        })
        
        
        $timeout(()=>drawPieStarts(290, "Starts Total Per Pump", 'cStarts', ['Pump 1', 'Pump 2'], allStartPP),100)
        $timeout(()=>drawPieStarts(280, "Starts Average Per Day", 'cSAPD', ['Pump 1', 'Pump 2'], allStartAPD),100)
        $timeout(()=>drawPieRuns(290, "Runtime Total Per Pump", 'cRuns', ['Pump 1', 'Pump 2'], allRunPP),100)
        $timeout(()=>drawPieRuns(280, "Runtime Average Per Day", 'cRAPD', ['Pump 1', 'Pump 2'], allRunAPD),100)
        $timeout(()=>drawPieRuns(270, "Runtime Average Per Cycle", 'cRAPC', ['Pump 1', 'Pump 2'], allRunAPC),100)
        
        if(pumpType === "Booster"){
            $timeout(()=>drawPieStarts(240, "Total Starts to Sleeps Comparison", 'start2SC', ['Sleeps', 'Starts'], st2SlComp),100)
            $timeout(()=>drawPieRuns(260, "Runtime Total to Sleep Comparison", 'run2SC', ['Sleep', 'Run'], run2SlComp),100)
        }
        if(pumpType === 'Condensate') $timeout(()=>drawPieStarts(290, "Water Temperature", 'cWaterTemp', ['Min Temp', 'Max Temp', 'Average Temp'], allWaterTemps),100)

    }

    const drawPieStarts = (titleOffset, titleString, canvas, labels, data) => {
        // ///Setup
        const canvasStarts = document.getElementById(canvas);
        const ctxStarts = canvasStarts.getContext('2d');
        canvasStarts.width = 800;
        canvasStarts.height = 300;
        
        // /////Title
        ctxStarts.font = `bold 24px serif` //title
        ctxStarts.fillText(titleString, titleOffset, 30)
    
        // // /////Legend
        // let h = 100
        // ctxStarts.strokeRect(10, canvasStarts.height -h -10, 100, h) // legend box
    
        // ctxStarts.font = `normal 10px serif` // legend labels
        // ctxStarts.textAlign = 'start'
        // ctxStarts.fillText('= Pump 1', 45, (canvasStarts.height -h -10) + 23)
        // ctxStarts.fillText('= Pump 2', 45, (canvasStarts.height -h -10) + 43)
    
        // ctxStarts.fillStyle = colors[0] // legend colors 
        // ctxStarts.fillRect(25, (canvasStarts.height -h -10) + 15, 10, 10)
        // ctxStarts.fillStyle = colors[1]
        // ctxStarts.fillRect(25, (canvasStarts.height -h -10) + 35, 10, 10)
    
        let n = 0
        const allData = data

        // ///////Make a pie for each obj
        allData.forEach(arr =>{ 
            let dataArr = arr;
    
            let total = dataArr.reduce((ttl, n)=>{return ttl + n}, 0)
            
            let startAngle = 4.74; 
            let radius = 70;
            let cx = canvasStarts.width/positions[n];
            let cy = canvasStarts.height/2;
        
            let i = 0;
            dataArr.forEach( index => {
            
                //set the styles before beginPath
                ctxStarts.fillStyle = colors[i]
                ctxStarts.lineWidth = 1;
                ctxStarts.strokeStyle = '#333';
                ctxStarts.beginPath();
                //console.log(total, house.troops, house.troops/total);
                // draw the pie wedges
                let endAngle = ((index / total) * Math.PI * 2) + startAngle;
                ctxStarts.moveTo(cx, cy);
                ctxStarts.arc(cx, cy, radius, startAngle, endAngle, false);
                ctxStarts.lineTo(cx, cy);
                ctxStarts.fill();
                ctxStarts.stroke();
                ctxStarts.closePath();
                
                // add the labels
                ctxStarts.beginPath();
                ctxStarts.font = '12px Helvetica, Calibri';
                ctxStarts.textAlign = 'center';
                ctxStarts.fillStyle = colors[i];
                // midpoint between the two angles
                // 1.5 * radius is the length of the Hypotenuse
                let theta = (startAngle + endAngle) / 2;
                let deltaY = (Math.sin(theta) * 1.5 * radius) ;
                let deltaX = (Math.cos(theta) * 1.4 * radius) ;
                /***
                SOH  - sin(angle) = opposite / hypotenuse
                                  = opposite / 1px
                CAH  - cos(angle) = adjacent / hypotenuse
                                  = adjacent / 1px
                TOA
                
                ***/
                ctxStarts.fillText(`${labels[i]} `, deltaX+cx, deltaY+cy);
                ctxStarts.fillText(`${index}`, deltaX+cx, deltaY+cy + 13);
                ctxStarts.closePath();
                
                startAngle = endAngle;
        
                i++
                if(i > 3) i =0
            })
            // ////////Bottom Labels
            ctxStarts.textAlign = 'center';
            ctxStarts.fillStyle = 'black';
            ctxStarts.font = `bold 20px serif`
            ctxStarts.fillText(`${titles[n]}`, canvasStarts.width / positions[n], 280)
            n++
        })
    
    }

    const drawPieRuns = (titleOffset, titleString, canvas, labels, data) => {
        // ///Setup
        const canvasStarts = document.getElementById(canvas);
        const ctxStarts = canvasStarts.getContext('2d');
        canvasStarts.width = 800;
        canvasStarts.height = 300;
    
        // /////Title
        ctxStarts.font = `bold 24px serif` //title
        ctxStarts.fillText(titleString, titleOffset, 30)
    
        let n = 0
        const allData = data

        // ///////Make a pie for each obj
        allData.forEach(obj =>{ 
            let dataArr = obj.data;
    
            let total = dataArr.reduce((ttl, n)=>{return ttl + n}, 0)
            
            let startAngle = 4.74; 
            let radius = 70;
            let cx = canvasStarts.width/positions[n];
            let cy = canvasStarts.height/2;
        
            let i = 0;
            dataArr.forEach( index => {
            
                //set the styles before beginPath
                ctxStarts.fillStyle = colors[i]
                ctxStarts.lineWidth = 1;
                ctxStarts.strokeStyle = '#333';
                ctxStarts.beginPath();
               
                // draw the pie wedges
                let endAngle = ((index / total) * Math.PI * 2) + startAngle;
                ctxStarts.moveTo(cx, cy);
                ctxStarts.arc(cx, cy, radius, startAngle, endAngle, false);
                ctxStarts.lineTo(cx, cy);
                ctxStarts.fill();
                ctxStarts.stroke();
                ctxStarts.closePath();
                
                // add the labels
                ctxStarts.beginPath();
                ctxStarts.font = '12px Helvetica, Calibri';
                ctxStarts.textAlign = 'center';
                ctxStarts.fillStyle = colors[i];
                // midpoint between the two angles
                // 1.5 * radius is the length of the Hypotenuse
                let theta = (startAngle + endAngle) / 2;
                let deltaY = (Math.sin(theta) * 1.5 * radius) ;
                let deltaX = (Math.cos(theta) * 1.4 * radius) ;
                /***
                SOH  - sin(angle) = opposite / hypotenuse
                                  = opposite / 1px
                CAH  - cos(angle) = adjacent / hypotenuse
                                  = adjacent / 1px
                TOA
                
                ***/
                ctxStarts.fillText(`${labels[i]}`, deltaX+cx, deltaY+cy + 13);
                ctxStarts.fillText(`${obj.rawTime[i][obj.hN[i]]} ${obj.scale[i]}`, deltaX+cx, deltaY+cy);
                ctxStarts.closePath();
                
                startAngle = endAngle;
        
                i++
                if(i > 3) i =0
            })
            // ////////Bottom Labels
            ctxStarts.textAlign = 'center';
            ctxStarts.fillStyle = 'black';
            ctxStarts.font = `bold 20px serif`
            ctxStarts.fillText(`${titles[n]}`, canvasStarts.width / positions[n], 280)
            n++
        })
    
    }


}]

export const pdf = ['$http', '$rootScope', '$timeout', function($http, $rootScope, $timeout){
    const ctrl = this;
    this.showPdfPreview = false;
    this.systemDisplayed = {};
    this.currentPumpData = {};
    this.pastPumpData = {}; 
    let type = ''
    
    this.backToSelectFile = () => ctrl.showPdfPreview = false
    const displayPdfPages = (pump) => {ctrl.includePath = `partials/previews/${pump}.html`, ctrl.showPdfPreview= true}
    
    this.changePage = (str) => {
        this.showPdfPreview = true;
        displayPdfPages(str);
    }

    // ================================== //
    // Getting the Y Scale for the Graghs //
    // ================================== //
    const determinYScale = (num) => {
        let lrgNum = num, tenLrg = 10, arr =[]

        while(lrgNum - tenLrg >=0 ) tenLrg *= 10 // find the next number up divisable by 10

        tenLrg = (tenLrg / 10) * 3 // divide that number by 10 so they have the same amount of digits then multiply by 3 so divisable by 3 (for 3 even parts)
        while(tenLrg <= lrgNum) tenLrg *=2 // if new number not grater then original num then double it
        for(let i = 0; i< 4; i++){arr.push((tenLrg / 3) * i)}
        return arr
    }
    // *****
    const determinYScaleTime = (num, t) => {
        let n = num, arr =[], timeUp = 0, topScale = t === 'h' ? 9 : 15
        while(n > topScale) topScale *=2 // if new number not grater then original num then double it
        if(topScale === 60) timeUp = 1 // for converting 60 m/s to the next time slot

        for(let i = 0; i< 4; i++){ // taking parts of the top time and formating it to the appropiate time
            let holderNum = (topScale /3) * i ;
            if(t !== 'h' && holderNum < 9) holderNum = '0' + holderNum;
            if(t === 's'){
                if(timeUp === 1 && i === 3) arr.push(`0:01:00`)
                else arr.push(`0:00:${holderNum}`)
            }
            else if(t === 'm'){
                if(timeUp === 1 && i === 3) arr.push(`1:00:00`)
                else arr.push(`0:${holderNum}:00`)
            }
            else arr.push(`${holderNum}:00:00`)
        }

        return arr
    }

    // ***************** END *******************************

    
    // ================================== //
    //   Draw the Canvas General Graphs   //
    // ================================== //

    const drawGraph = (graph, scale, d, dP, title) => {
        let canvas = document.getElementById(graph);
        const ctx = canvas.getContext('2d')
        canvas.width = 350;
        canvas.height = 250;
        let data = d, yScale = scale, dataPercentage = dP
        

        let width = 25 // bar width 
        let X = 50 // first bar position 

        ctx.font = '24px calibri'; 
        const text = ctx.measureText(title);
        ctx.fillText(title, (canvas.width - text.width)/2 , 40);
        
        ctx.textAlign = "right"
        ctx.fillStyle = '#000000'
        ctx.strokeStyle = 'rgba(0,0,0,.2)'
        for(let i = 0; i < yScale.length; i++){ // set up the y scale 
            let y = 170, f = 13

            if(ctx.measureText(yScale[i]).width >= 49 && yScale[i] !== "0:00:00") f= 11
            ctx.font = `bold 12px serif`; 
            ctx.measureText(yScale[i]).width > 50 ? ctx.fillText(yScale[i], 55 , y + (-33.3333 * i)) : ctx.fillText(yScale[i], 50 , y + (-33.3333 * i))
            
            ctx.beginPath();
            ctx.moveTo(55, y + (-33.3333 * i));
            ctx.lineTo(340, y + (-33.3333 * i));
            ctx.stroke();
            ctx.closePath();
            
        }
        ctx.textAlign = "start"
        

        for(let i = 0; i < data.length; i++){ // loop through the bars 
            const h = dataPercentage[i]
            let t = ctx.measureText(`${data[i]}`);
            let center = (width - t.width)/2; // calculating the center of the width of pixels for the numbers ontop of the bars
            

            if(data.length === 3 || data.length === 6){
                if(i === 0 || i === 3){
                    ctrl.pastPumpData.date ? X += 15 : X+= 90
                    if(i === 3) X += 10
                    if(center < 0 ) X += (center -1); // pushing the bars apart if the text overlaps 
                    ctx.fillStyle = '#5e74b1';
                    ctx.fillRect(X , (canvas.height - h)-80, width, h) //making bar
                }
                else if(i === 1 || i === 4){
                    if(center < 0 ) X +=( Math.abs(center) + 3); // pushing the bars apart if the text overlaps 
                    ctx.fillStyle = '#d97502'
                    ctx.fillRect(X, (canvas.height - h)-80, width, h) //making bar
                }
                else{
                    if(center < 0 ) X +=( Math.abs(center) + 3); // pushing the bars apart if the text overlaps 
                    ctx.fillStyle = '#a8a5a5'
                    ctx.fillRect(X, (canvas.height - h)-80, width, h) //making bar
                }
            }
            else{
                if(i % 2 === 0){
                    ctrl.pastPumpData.date ? X += 50 : X+= 110
                    if(center < -10 ) X += (center -10); // pushing the bars apart if the text overlaps 
                    else if(center < 0 ) X += (center -3); 
                    ctx.fillStyle = '#5e74b1';
                    ctx.fillRect(X , (canvas.height - h)-80, width, h) //making bar
                }
                else{
                    if(center < -10 ) X +=( Math.abs(center) + 12); // pushing the bars apart if the text overlaps 
                    else if(center < 0 ) X +=( Math.abs(center) + 5);  
                    ctx.fillStyle = '#d97502'
                    ctx.fillRect(X, (canvas.height - h)-80, width, h) //making bar
                }
            }


            ctx.font = 'bold 14px serif'; // words on top of bar
            ctx.fillStyle = '#000000'
            ctx.fillText(`${data[i]}`, X + (center), (canvas.height - h)-85);
            // console.log(center)

            X += 35 // move over for next bar
        }

        // Bottom Legend 
        if(data.length === 3 || data.length === 6){
            ctx.font = 'bold 14px calibri';
            ctx.fillStyle = '#000000'
            ctx.fillText("Pump 1", 85, 229)
            ctx.fillText("Pump 2", 165, 229)
            ctx.fillText("Pump 3", 245, 229)
    
            ctx.fillStyle = "#5e74b1"
            ctx.fillRect(70, 220, 10, 10)
            
            ctx.fillStyle = "#d97502"
            ctx.fillRect(150, 220, 10, 10)
            
            ctx.fillStyle = "#a8a5a5"
            ctx.fillRect(230, 220, 10, 10)       
            
            ctx.fillStyle = '#000000'
        }
        else{
            ctx.font = 'bold 14px calibri';
            ctx.fillStyle = "#5e74b1"
            ctx.fillRect(130, 220, 10, 10)
            ctx.fillStyle = '#000000'
            ctx.fillText("Pump 1", 145, 229)
    
            ctx.fillStyle = "#d97502"
            ctx.fillRect(200, 220, 10, 10)
            ctx.fillStyle = '#000000'
            ctx.fillText("Pump 2", 215, 229)
        }

        if(ctrl.pastPumpData.date){
            ctx.fillText(ctrl.pastPumpData.date, 104, 190)
            ctx.fillText(ctrl.currentPumpData.date, 224, 190)
        }
    }

    // ***************** END *******************************

        
    
    // ================================== //
    //     Draw the Canvas Avrag Run      //
    // ================================== //

    const drawRuntimeAvrgChart = () => {
        const time = processTime("Avrage");
        const yScale = determinYScaleTime(time.highNum, time.timePlace);
        const lastYscale = yScale[yScale.length -1].split(":");
        let dataPercentage=[], calculatedLastYscale =0
        
        const toSecondsAr = [3600, 60, 1]
        for(let i =0; i < 3; i++) calculatedLastYscale += (parseInt(lastYscale[i]) * toSecondsAr[i]) // converting the last y to seconds

        time.rawTime.forEach( t =>{ // turning the data into a graph percentage
            let holder = 0;
            holder += parseInt(t.h) * 3600;
            holder += parseInt(t.m) * 60;
            holder += parseInt(t.s);
            
            dataPercentage.push((holder / calculatedLastYscale) * 100)
        })
        
        drawGraph('avrgrunchart', yScale, time.data, dataPercentage, "Average Cycle Time")
    }

    // ******************** END ****************************

    // ================================== //
    //      Draw the Canvas Starts        //
    // ================================== //
    
    const drawStartsChart = () => {
        let highNum = 0 , data = [], dataPercentage = []

        if(ctrl.pastPumpData.date){ // finding out wich numbers are relevent and which is the largest relevent number 
            const sk2 = Object.keys(ctrl.pastPumpData)
            sk2.forEach(k => {
                const ar = k.split(" ") 
                if(ar[ar.length -1] === "Starts"){
                    ctrl.pastPumpData[k] >= highNum ? highNum = ctrl.pastPumpData[k] : highNum = highNum;
                    data.push(ctrl.pastPumpData[k]);
                }
            })
        }
        const sk = Object.keys(ctrl.currentPumpData) 
        sk.forEach(k => {
            const ar = k.split(" ") 
            if(ar[ar.length -1] === "Starts"){
                ctrl.currentPumpData[k] >= highNum ? highNum = ctrl.currentPumpData[k] : highNum = highNum;
                data.push(ctrl.currentPumpData[k])
            }
        })  
        const yScale = determinYScale(highNum) // getting the y scale 

        for(let i = 0; i < data.length; i++){ dataPercentage.push((data[i] / yScale[yScale.length -1]) * 100) }// turning relevent data into a percentage for the graphs 

        

        drawGraph('startschart', yScale, data, dataPercentage, "Starts")
    }
    // ******************** END ****************************
    
    // ================================== //
    //     Draw the Canvas Total Run      //
    // ================================== //

    const drawTotalRuntimeChart = () => {
        const time = processTime("Total");
        const yScale = determinYScaleTime(time.highNum, time.timePlace);
        const lastYscale = yScale[yScale.length -1].split(":");
        let dataPercentage=[], calculatedLastYscale =0
        
        const toSecondsAr = [3600, 60, 1]
        for(let i =0; i < 3; i++) calculatedLastYscale += (parseInt(lastYscale[i]) * toSecondsAr[i]) // converting the last y to seconds

        time.rawTime.forEach( t =>{ // turning the data into a graph percentage
            let holder = 0;
            holder += parseInt(t.h) * 3600;
            holder += parseInt(t.m) * 60;
            holder += parseInt(t.s);
            
            dataPercentage.push((holder / calculatedLastYscale) * 100)
        })
        
        drawGraph('totalrunchart', yScale, time.data, dataPercentage, "Total Runtime")
    }

    // ******************** END ****************************

        
    
    // =================================== //
    // Draw the Canvas Booster Sleep Times //
    // =================================== //

    const drawTotalSleepTime = () => {
        let canvas = document.getElementById('sleeptimechart');
        const ctx = canvas.getContext('2d')
        canvas.width = 350;
        canvas.height = 250;

        ///////// Get The Calcs of Time ////////////////////
        const time = processTime("sleepTimeTotal");
        const yScale = determinYScaleTime(time.highNum, time.timePlace);
        const lastYscale = yScale[yScale.length -1].split(":");
        let dataPercentage=[], calculatedLastYscale =0, data = time.data
        
        const toSecondsAr = [3600, 60, 1]
        for(let i =0; i < 3; i++) calculatedLastYscale += (parseInt(lastYscale[i]) * toSecondsAr[i]) // converting the last y to seconds

        time.rawTime.forEach( t =>{ // turning the data into a graph percentage
            let holder = 0;
            holder += parseInt(t.h) * 3600;
            holder += parseInt(t.m) * 60;
            holder += parseInt(t.s);
            
            dataPercentage.push((holder / calculatedLastYscale) * 100)
        })

        /////////// Start Drawing the Canvas /////////////// 

        let width = 25 // bar width 
        let X = 0 // first bar position 
        const title = "Total Sleep Time"

        ctx.font = '24px calibri'; 
        const text = ctx.measureText(title);
        ctx.fillText(title, (canvas.width - text.width)/2 , 40);
        
        ctx.textAlign = "right"
        ctx.fillStyle = '#000000'
        ctx.strokeStyle = 'rgba(0,0,0,.2)'
        for(let i = 0; i < yScale.length; i++){ // set up the y scale 
            let y = 170, f = 12

            if(ctx.measureText(yScale[i]).width >= 49 && yScale[i] !== "0:00:00") f= 11
            ctx.font = `bold 12px serif`; 
            ctx.fillText(yScale[i], 50 , y + (-33.3333 * i));
            
            ctx.beginPath();
            ctx.moveTo(55, y + (-33.3333 * i));
            ctx.lineTo(340, y + (-33.3333 * i));
            ctx.stroke();
            ctx.closePath();
            
        }
        ctx.textAlign = "start"


        for(let i = 0; i < data.length; i++){ // loop through the bars 
            const h = dataPercentage[i]
            let t = ctx.measureText(`${data[i]}`);
            let center = (width - t.width)/2; // calculating the center of the width of pixels for the numbers ontop of the bars


            
            ctrl.pastPumpData.date ? X += 120 : X = canvas.width /2
            ctx.fillStyle = '#5e74b1';
            ctx.fillRect(X , (canvas.height - h)-80, width, h) //making bar
            
           


            ctx.font = 'bold 14px serif'; // words on top of bar
            ctx.fillStyle = '#000000'
            ctx.fillText(`${data[i]}`, X + (center), (canvas.height - h)-85);

        }

        // Bottom Legend
        ctx.font = 'bold 14px calibri';
        if(ctrl.pastPumpData.date){
            ctx.fillText(ctrl.pastPumpData.date, 110, 190)
            ctx.fillText(ctrl.currentPumpData.date, 230, 190)
        }
        
    }

    // ***************** END *******************************
    
    // ================================== //
    //     Draw the Canvas Water Temp     //
    // ================================== //
    const drawWaterTemp = () => {
        let canvas = document.getElementById("watertempchart");
        const ctx = canvas.getContext('2d')
        canvas.width = 350;
        canvas.height = 250;
        let width = 25 // bar width 
        let X = 32 // first bar position 

        /////////// Get the Calcs of the Data ///////////
        let highNum = 0 , data = [], dataPercentage = []

        if(ctrl.pastPumpData.date){ // finding out wich numbers are relevent and which is the largest relevent number 
           data.push(ctrl.pastPumpData.avgTemp);
           data.push(ctrl.pastPumpData.minTemp);
           data.push(ctrl.pastPumpData.maxTemp);
           highNum = ctrl.pastPumpData.maxTemp;
        }
        data.push(ctrl.currentPumpData.avgTemp);
        data.push(ctrl.currentPumpData.minTemp);
        data.push(ctrl.currentPumpData.maxTemp);
        if(ctrl.currentPumpData.maxTemp > highNum) highNum = ctrl.currentPumpData.maxTemp; 
        
        const yScale = determinYScale(highNum) // getting the y scale 

        for(let i = 0; i < data.length; i++){ dataPercentage.push((data[i] / yScale[yScale.length -1]) * 100) }// turning relevent data into a percentage for the graphs 

        
        ///////////////// Start Drawing the Chart ////////////////// 
        const title = "Water Temperature"
        ctx.font = '24px calibri'; 
        const text = ctx.measureText(title);
        ctx.fillText(title, (canvas.width - text.width)/2 , 40);
        
        ctx.textAlign = "right"
        ctx.fillStyle = '#000000'
        ctx.strokeStyle = 'rgba(0,0,0,.2)'
        for(let i = 0; i < yScale.length; i++){ // set up the y scale 
            let y = 170
            ctx.font = `bold 12px serif`; 
            ctx.fillText(yScale[i], 50 , y + (-33.3333 * i));
            
            ctx.beginPath();
            ctx.moveTo(55, y + (-33.3333 * i));
            ctx.lineTo(340, y + (-33.3333 * i));
            ctx.stroke();
            ctx.closePath();
            
        }
        ctx.textAlign = "start"


        for(let i = 0; i < data.length; i++){ // loop through the bars 
            const h = dataPercentage[i]
            let t = ctx.measureText(`${data[i]}`);
            let center = (width - t.width)/2; // calculating the center of the width of pixels for the numbers ontop of the bars


            if(i === 0 || i === 3){
                ctrl.pastPumpData.date ? X += 47 : X+= 120
                if(center < 0 ) X += (center -1); // pushing the bars apart if the text overlaps 
                ctx.fillStyle = '#5e74b1';
                ctx.fillRect(X , (canvas.height - h)-80, width, h) //making bar
            }
            else if(i === 1 || i === 4){
                if(center < 0 ) X +=( Math.abs(center) + 3); // pushing the bars apart if the text overlaps 
                ctx.fillStyle = '#d97502'
                ctx.fillRect(X, (canvas.height - h)-80, width, h) //making bar
            }
            else{
                if(center < 0 ) X +=( Math.abs(center) + 3); // pushing the bars apart if the text overlaps 
                ctx.fillStyle = '#a8a5a5'
                ctx.fillRect(X, (canvas.height - h)-80, width, h) //making bar
            }


            ctx.font = 'bold 14px serif'; // words on top of bar
            ctx.fillStyle = '#000000'
            ctx.fillText(`${data[i]}`, X + (center), (canvas.height - h)-85);
            // console.log(center)

            X += 30 // move over for next bar
        }

        // Bottom Legend 
        ctx.font = 'bold 14px calibri';
        ctx.fillStyle = '#000000'
        ctx.fillText("Avg Temp", 85, 229)
        ctx.fillText("Min Temp", 165, 229)
        ctx.fillText("Max Temp", 245, 229)

        ctx.fillStyle = "#5e74b1"
        ctx.fillRect(70, 220, 10, 10)
        
        ctx.fillStyle = "#d97502"
        ctx.fillRect(150, 220, 10, 10)
        
        ctx.fillStyle = "#a8a5a5"
        ctx.fillRect(230, 220, 10, 10)       
        
        ctx.fillStyle = '#000000'
        if(ctrl.pastPumpData.date){
            ctx.fillText(ctrl.pastPumpData.date, 100, 190)
            ctx.fillText(ctrl.currentPumpData.date, 235, 190)
        }
    }

    // ***************** END *******************************

    // ================================================================================================================================ //
    //                                          THIS IS THE START OF THE PDF MAKING PROCESS                                            //
    // ============================================================================================================================== //
    
    // takes data and makes it into a pdf
    $rootScope.$on('makePdf', (event, data)=> makeIntoPdf(data))
    
    const makeIntoPdf = (dataObj) => {
        type = dataObj[0].type
        $timeout(()=>displayPdfPages(dataObj[0].type) )   
        ctrl.currentPumpData = dataObj[0];
        ctrl.pastPumpData = dataObj[2];
        
        // $timeout(()=>drawStartsChart(),100)
        // $timeout(()=>drawTotalRuntimeChart(),100)
        // $timeout(()=>drawRuntimeAvrgChart(),100)
        // if(ctrl.currentPumpData.type === "Condensate") $timeout(()=>drawWaterTemp(),100)
        // if(ctrl.currentPumpData.type === "Booster") $timeout(()=>drawTotalSleepTime(),100)
        
        ctrl.systemDisplayed = dataObj[1]

        let strVer = JSON.stringify(ctrl.currentPumpData) //use stringify so itll save in the database
        // console.log(JSON.parse(strVer)) //use parse to convert back to obj to use 
    }

    // ================================== //
    //           Process Time             //
    // ================================== //
    const processTime = (str) => {
        let highNum = 0, timePlace = 0, data =[], rawTime=[]

        if(ctrl.pastPumpData.date){ // finding out wich numbers are relevent and which is the largest relevent number 
            const sk2 = Object.keys(ctrl.pastPumpData)
            sk2.forEach(k => {
                const ar = k.split(" ") 
                if(ar[ar.length -1] === str){
                    const timeObj = ctrl.pastPumpData[k]
                    rawTime.push(timeObj)

                    let tN = 0, tP = 0 //getting the highest val and time of each pump
                    if(timeObj.h > 0) {tN = timeObj.h, tP = 3}
                    else if(timeObj.m > 0) {tN = timeObj.m, tP = 2}
                    else {tN = timeObj.s, tP = 1}
                    
                    if(tP > timePlace){highNum = tN, timePlace = tP} //determing if the pumps highest val is the overall highest val
                    else if (tP === timePlace){ if(tN > highNum) highNum = tN}

                    timeObj.m = parseInt(timeObj.m)
                    timeObj.s = parseInt(timeObj.s)
                    if(timeObj.m < 10) timeObj.m = "0" + timeObj.m // formating the data to into time for display 
                    if(timeObj.s < 10) timeObj.s = "0" + timeObj.s
                    timeObj.h > 0 ? data.push(`${timeObj.h}:${timeObj.m}`) : data.push(`${timeObj.m}:${timeObj.s}`);
                }
            })
        }
        const sk = Object.keys(ctrl.currentPumpData) 
        sk.forEach(k => {
            const ar = k.split(" ") 
            if(ar[ar.length -1] === str){
                const timeObj = ctrl.currentPumpData[k]
                rawTime.push(timeObj)
                
                let tN = 0, tP = 0 //getting the highest val and time of each pump
                if(timeObj.h > 0) {tN = timeObj.h, tP = 3}
                else if(timeObj.m > 0) {tN = timeObj.m, tP = 2}
                else {tN = timeObj.s, tP = 1}

                if(tP > timePlace){highNum = tN, timePlace = tP} //determing if the pumps highest val is the overall highest val
                else if (tP === timePlace){ if(tN > highNum) highNum = tN}

                timeObj.m = parseInt(timeObj.m)
                timeObj.s = parseInt(timeObj.s)
                if(timeObj.m < 10) timeObj.m = "0" + timeObj.m // formating the data to into time for display 
                if(timeObj.s < 10) timeObj.s = "0" + timeObj.s
                timeObj.h > 0 ? data.push(`${timeObj.h}:${timeObj.m}`) : data.push(`${timeObj.m}:${timeObj.s}`);
            }
        })

        if(timePlace === 3) timePlace = 'h'
        if(timePlace === 2) timePlace = 'm'
        if(timePlace === 1) timePlace = 's'

        return {highNum, timePlace, data, rawTime}
    }

    // ******************** END ****************************

    // ================================== //
    //        Final PDF Commit            //
    // ================================== //

    this.savePdf = () => {
        if(type === 'Booster'){
            const e = document.getElementById(`${ctrl.currentPumpData.type}PdfDiv`)
            const e2 = document.getElementById(`${ctrl.currentPumpData.type}PdfDiv2`)
            const e3 = document.getElementById(`${ctrl.currentPumpData.type}PdfDiv3`)
            
            html2canvas(e,{scale: 2}).then(canvas => {
                const imgData = canvas.toDataURL('image/png')
                html2canvas(e2,{}).then(c => {
                    const imgD2 = c.toDataURL('image/png')
                    html2canvas(e3,{}).then(c3 => {
                        const imgD3 = c3.toDataURL('image/png')
                        const doc = new jspdf.jsPDF()
                        const imgHeight = canvas.height * 210 / canvas.width
                        // console.log(imgData)
                        doc.addImage(imgData, 0, 0, 210, imgHeight -30)
                        doc.addPage()
                        doc.addImage(imgD2, 0, 0, 210, imgHeight -30)
                        doc.addPage()
                        doc.addImage(imgD3, 0, 0, 210, imgHeight -30)
                        doc.save(`${ctrl.systemDisplayed.name} ${ctrl.currentPumpData.date} ${ctrl.currentPumpData.type} Monthly Report.pdf`)
                    })
                })
    
            })
        }
    }


    // ******************* END *****************************

}]


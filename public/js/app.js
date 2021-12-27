import {dp} from './DataP.js'
import {pdf} from './PDF.js'
import {graph} from './Graph.js'

const app = angular.module('DataProcessorApp', []);


app.controller('DataController', dp );
app.controller('PdfController', pdf);
app.controller('GraphController', graph);

app.service('DataProcessingService', function($rootScope){
    this.activateMakePdf = (data)=> $rootScope.$emit('makePdf', data)
})
function getQueryVariable(variable)
{
  var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

//The hourDefs array specifies the 30 minute segments that the WeMo data is matched to
//If the time of the WeMo data is not in here (ie 2:24) it will not be included.
var hourDefs = [
  "23:59", "0:30",
  "1:00","1:30",
  "2:00","2:30",
  "3:00","3:30",
  "4:00","4:30",
  "5:00","5:30",
  "6:00","6:30",
  "7:00","7:30",
  "8:00","8:30",
  "9:00","9:30",
  "10:00","10:30",
  "11:00","11:30",
  "12:00","12:30",
  "13:00","13:30",
  "14:00","14:30",
  "15:00","15:30",
  "16:00","16:30",
  "17:00","17:30",
  "18:00","18:30",
  "19:00","19:30",
  "20:00","20:30",
  "21:00","21:30",
  "22:00","22:30",
  "23:00","23:30"
];

//The title variable is a global variable that will be set as the chart title.
var title;
var type;

/*
  The "request" function starts the program.  
  It uses XMLHttpRequest to load the data file, which is then parsed
  by the formatTable function later. The buttons in the website
  trigger this function, passing a filename (ie: microwave.csv) and
  a chart name (ie: White Microwave)
*/
function request(file, chartName, dataType) {
  //Set up a new XMLHttpRequest
  //A XHR is used to access files in JavaScript, like the csv data files
  var rq = new XMLHttpRequest();
  //Set the chart title based on whatever name was given to the funtion.
  title = chartName;
  //Open the XHR and request the variable 'file'
  rq.open('GET', file, true);
  //Once the request is done, activate the formatTable function
  if (dataType == null || dataType == "wemo") {
    rq.onload = formatTable;
  } else if (dataType == "ted") {
    rq.onload = formatTedData;
  }
  //Start the request
  rq.send();
}

/*
  The formatTable function takes the csv file and turns
  it into an array that Google Charts will use later.
*/
var formattedChart = new Object();
function formatTable(responseFile) {
  //formattedChart will store the chart and some extra data
  formattedChart = {};
  //The function csvParse will turn the csv file into an array
  var table;
  if (responseFile[0] == null) {
    var table = csvParse(this.responseText);
  } else {
    var table = responseFile;
  }
  test = responseFile;
  
  //The energyDataRow variable looks for whichever row contains the words 'Energy Data'
  //it will be used later to strip out some unneeded data
  var energyDataRow;

  //Loops through the array until it finds the text 'Energy Data'
  for (var i = 0; i < table.length; i++) {
    if (table[i][0].indexOf("Energy Data") > -1) {
      energyDataRow = i;
      break;
    }
  }
  
  //Remove all rows, up to and including "Energy Data" and "Date & Time,Power Consumed for past 30 mins (kWh)""
  table.splice(0, energyDataRow + 2);
  for (var i = 0; i < table.length; i++) {
    var date = new Date(table[i][0]);
    table[i][0] = date;
  }
  //With the unwanted data stripped away, set the sourceCode property to contain the original file
  formattedChart.sourceCode = table;

  //Prep 2D array
  formattedChart.averageSource = [];
  for (var i = 0; i < hourDefs.length; i++) {
    formattedChart.averageSource[i] = [];
  }

  for (var i = 0; i < formattedChart.sourceCode.length; i++) {
    //Turn the time in the original table into a hour:minute format to match with hourDefs
    var time = formattedChart.sourceCode[i][0].getHours() + ':' + formattedChart.sourceCode[i][0].getMinutes();
    if (formattedChart.sourceCode[i][0].getMinutes() == 0) {
      time = formattedChart.sourceCode[i][0].getHours() + ':0' + formattedChart.sourceCode[i][0].getMinutes();
    }

    var index = hourDefs.indexOf(time);
    if (index != -1) {
      formattedChart.averageSource[index].push(formattedChart.sourceCode[i][1]);
    }
  }

  formattedChart.average = [];
  for (var i = 0; i < formattedChart.averageSource.length; i++) {
    var total = 0;
    for (var j = 0; j < formattedChart.averageSource[i].length; j++) {
      total += parseFloat(formattedChart.averageSource[i][j]);
    }

    formattedChart.average[i] = [hourDefs[i], parseFloat((total/formattedChart.averageSource[i].length).toFixed(5))];
  }

  formattedChart.full = [];
  formattedChart.full[0] = ["Time"];
  for (var i = 0; i < hourDefs.length; i++) {
    formattedChart.full[i + 1] = [hourDefs[i]];
  }

  for (var i = formattedChart.sourceCode.length - 2; i >= 0; i--) {
    var noTime = new Date(formattedChart.sourceCode[i][0].getFullYear(), 
        formattedChart.sourceCode[i][0].getMonth(), 
        formattedChart.sourceCode[i][0].getDate());
    var column = -1;
    for (var j = 1; j < formattedChart.full[0].length; j++) {
      if (noTime.toDateString() == formattedChart.full[0][j].toDateString()) {
        column = j;
        break;
      }
    }
    if (column == -1) {
      column = formattedChart.full[0].push(noTime);
      column -= 1;
    }
    var time = formattedChart.sourceCode[i][0].getHours() + ':' + formattedChart.sourceCode[i][0].getMinutes();
    if (formattedChart.sourceCode[i][0].getMinutes() == 0) {
      time = formattedChart.sourceCode[i][0].getHours() + ':0' + formattedChart.sourceCode[i][0].getMinutes();
    }
    for (var j = 0; j < formattedChart.full.length; j++) {
      if (formattedChart.full[j][0] == time) {
        formattedChart.full[j][column] = parseFloat(formattedChart.sourceCode[i][1]);
        break;
      }
    }
  }

  var reCheckColumn = formattedChart.full[0].length;
  for (var j = 1; j < formattedChart.full.length; j++) {
    if (formattedChart.full[j].length < reCheckColumn) {
      var blankSpaceAmount = reCheckColumn - formattedChart.full[j].length;
      for (var k = 0; k < blankSpaceAmount; k++) {
        formattedChart.full[j].push(null);
      }
    }
  }

  //Insert the average line
  formattedChart.full[0].splice(1, 0, "Average");
  for (var k = 0; k < formattedChart.average.length; k++) {
    formattedChart.full[k+1].splice(1, 0, formattedChart.average[k][1]);
  }

  loadChart(formattedChart.full, title, "wemo"); 
}

function formatTedData(responseFile) {
  formattedChart = {};
  var tedHours = {};
  tedHours.string = [];
  tedHours.hour = [];
  for (var i = 0; i < 24; i++) {
    tedHours.string[i] = i + ":00";
    tedHours.hour[i] = i;
  }

  var table;
  if (responseFile[0] == null) {
    var table = csvParse(this.responseText);
  } else {
    var table = responseFile;
  }
  formattedChart.type = "ted";
  formattedChart.sourceCode = [];
  for (var i = 1; i < table.length; i++) {
    formattedChart.sourceCode[i-1] = [];
    formattedChart.sourceCode[i-1][0] = new Date(table[i][1]);
    formattedChart.sourceCode[i-1][1] = parseFloat(table[i][2]);
  }

  formattedChart.averageSource = [];
  for (var i = 0; i < 24; i++) {
    formattedChart.averageSource[i] = [];
  }
  for (var i = 0; i < formattedChart.sourceCode.length; i++) {
    var time = formattedChart.sourceCode[i][0].getHours();

    var index = tedHours.hour.indexOf(time);
    if (index != -1) {
      formattedChart.averageSource[index].push(formattedChart.sourceCode[i][1]);
    }
  }
  formattedChart.average = [];
  for (var i = 0; i < formattedChart.averageSource.length; i++) {
    var total = 0;
    for (var j = 0; j < formattedChart.averageSource[i].length; j++) {
      total += parseFloat(formattedChart.averageSource[i][j]);
    }

    formattedChart.average[i] = parseFloat((total/formattedChart.averageSource[i].length).toFixed(5));
  }

  formattedChart.full = [];
  formattedChart.full[0] = ["Time"];
  for (var i = 0; i < tedHours.string.length; i++) {
    formattedChart.full[i+1] = [tedHours.string[i]];
  }
  for (var i = formattedChart.sourceCode.length - 1; i >= 0; i--) {
    var thisHour = new Date(0);
    thisHour.setHours(formattedChart.sourceCode[i][0].getHours());

    var thisDate = new Date(formattedChart.sourceCode[i][0].getFullYear(), 
        formattedChart.sourceCode[i][0].getMonth(), 
        formattedChart.sourceCode[i][0].getDate());

    //Check if date preexists
    var column = -1;
    for (var j = 1; j < formattedChart.full[0].length; j++) {
      if (thisDate.toDateString() == formattedChart.full[0][j].toDateString()) {
        column = j;
        break;
      }
    }
    if (column == -1) {
      column = formattedChart.full[0].push(thisDate);
      column -= 1;
    }

    var time = formattedChart.sourceCode[i][0].getHours() + ':00';
    for (var j = 0; j < formattedChart.full.length; j++) {
      if (formattedChart.full[j][0] == time) {
        formattedChart.full[j][column] = parseFloat(formattedChart.sourceCode[i][1]);
        break;
      }
    }
  }

  var reCheckColumn = formattedChart.full[0].length;
  for (var j = 1; j < formattedChart.full.length; j++) {
    if (formattedChart.full[j].length < reCheckColumn) {
      var blankSpaceAmount = reCheckColumn - formattedChart.full[j].length;
      for (var k = 0; k < blankSpaceAmount; k++) {
        formattedChart.full[j].push(null);
      }
    }
  }

  //Insert the average line
  formattedChart.full[0].splice(1, 0, "Average");
  for (var k = 0; k < formattedChart.average.length; k++) {
    formattedChart.full[k+1].splice(1, 0, formattedChart.average[k]);
  }

  loadChart(formattedChart.full, title, "ted"); 
}

function csvParse(string) {
  if (string == null) {return;}

  var array = string.split("\n");
  for (var i = 0; i < array.length; i++) {
    var array2d = array[i].split(",");
    array[i] = array2d;
  }
  return array;
}

function loadChart(chartArray, title, dataType) {
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Time');
  data.addColumn('number', 'Average');
  for (var i = 2; i < chartArray[0].length; i++) {
    var dateString;
    dateString = chartArray[0][i].getMonth()+1 + '/' + chartArray[0][i].getDate() + '/' + chartArray[0][i].getFullYear() + ' Power';
    data.addColumn('number', dateString);
  }
  for (var i = 2; i < chartArray.length; i++) {
    data.addRow(chartArray[i]);
  }

  var options = {
    title: title,
    animation: {
      duration: 300,
      easing: 'linear'
    },
    explorer: { 
      maxZoomIn: 0.1
    },
    hAxis: { 
      title: 'Time',
      titleTextStyle: {
        italic: false
      } 
    },
    vAxis: { 
      title: 'Power Consumed for past 30 mins (kWh)',
      titleTextStyle: {
        italic: false
      },
      viewWindow: {
        max: 0.2,
        min: 0
      }
    },
    series: {
      0: { 
        color: '#000000',
        lineWidth: 5,
        lineDashStyle: [4,1]
      }
    },
    legend: { position: 'bottom' }
  };
  if (dataType == "ted") {
    options.vAxis.viewWindow = null;
  }

  var chart = new google.visualization.LineChart(document.getElementById('chart'));
  chart.draw(data, options);

  var table = new google.visualization.Table(document.getElementById('table'));
  table.draw(data, {showRowNumber: false});

  var weekBox = document.getElementById("week");
  var hourBox = document.getElementById("hour");
  var averageBox = document.getElementById("average");
  weekBox.addEventListener('change', changeView, false);
  hourBox.addEventListener('change', changeView, false);
  averageBox.addEventListener('change', changeView, false);

  var allColumnIndexs = [0,1];
  var weekday = [0, 1];
  for (var i = 2; i < chartArray[0].length; i++) {
    if (chartArray[0][i].getDay() != 0 && chartArray[0][i].getDay() != 6) {
      weekday.push(i);
    }
    allColumnIndexs.push(i);
  }
  function changeView()
  {
    var view = new google.visualization.DataView(data);

    if (averageBox.checked) {
      view.setColumns([0, 1]);
    } else if (weekBox.checked) {
      view.setColumns(weekday);
    } else {
      view.setColumns(allColumnIndexs);
    }

    if (hourBox.checked) {
      if (dataType == "wemo") {
        view.setRows(17, 31);
      } else if (dataType == "ted") {
        view.setRows(9, 16);
      }
    } else {
      if (dataType == "wemo") {
        view.setRows(0, 46);
      } else if (dataType == "ted") {
        view.setRows(0, 22);
      }
    }
    chart.draw(view, options);
  }

  changeView();
}

if (getQueryVariable("chart") == false) {
  request('microwave.csv', 'White Microwave');
} else {
  switch(getQueryVariable("chart")) {
    case 'microwave':
      request('microwave.csv', 'White Microwave');
      break;
    case 'copier':
      request('copier.csv', 'Copier');
      break;
    case 'fridge':
      request('fridge.csv', 'Fridge');
      break;
    case 'imaging':
      request('imaging.csv', 'Imaging System');
      break;
    case 'ted':
      request('ted.csv', 'TED', 'ted');
      break;
    case 'techDirector':
      request('techDirector.csv', 'Tech Director');
      break;
    case 'extMicrowave':
      request('extMicrowave.csv', 'Exterior Microwave');
      break;
  }
}

function fileSelect(e) {
  var file = e.target.files[0];
  var reader = new FileReader();
  var progress = document.getElementById('progress');
  var bar = document.getElementById('bar');

  bar.style.width = '0%';
  bar.innerHTML = '';

  reader.onerror = function(e) {
    progress.className = 'error';
    switch(evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        bar.innerHTML = 'File Not Found!';
        break;
      case evt.target.error.NOT_READABLE_ERR:
        bar.innerHTML = 'File read cancelled';
        break;
      case evt.target.error.ABORT_ERR:
        bar.innerHTML = 'File is not readable';
        break; 
      default:
        bar.innerHTML = 'An error occurred reading this file.';
    };
    setTimeout("progress.className='';", 5000);
  }
  reader.onprogress = function(e) {
    if (e.lengthComputable) {
      var percentLoaded = Math.round((e.loaded / e.total) * 100);
      if (percentLoaded < 100) {
        bar.style.width = percentLoaded + '%';
        bar.innerHTML = percentLoaded + '%';
      }
    }
  }
  reader.onstart = function(e) {
    progress.className = 'loading';
  }
  reader.onload = (function(theFile) {
    return function(e) {
      setTimeout("progress.className='';", 5000);
      var csv = csvParse(e.target.result);
      if (csv[0][0] === "Exported Data for WeMo_Insight") {
        title = "Custom WeMo Data";
        formatTable(csv);
      } else if (csv[0][0] === "MTU") {
        title = "Custom TED Data";
        formatTedData(csv);
      }
    }
  })(file);
  reader.readAsText(file);
}
document.getElementById("file").addEventListener('change', fileSelect, false);
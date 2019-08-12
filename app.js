const readdirp = require('readdirp');
const fs = require('fs');


if (fs.existsSync(__dirname + '/report.csv')) {
    try {
        fs.unlinkSync(__dirname + '/report.csv');
    } catch (err) {
        return console.log(err);
    }
}

fs.writeFile(__dirname + '/report.csv', 'File Path,Imports\n', function(err) {
    if(err) {
        return console.log(err);
    }
});



readdirp(__dirname + '/ConfigurationApplication/src/js', {
        fileFilter: ['*.js', '!loader.js', '!*-strings.js'],
        alwaysStat: true
    })
    .on('data', (entry) => {
        const {path, stats: {size}} = entry;
        fs.readFile(entry.fullPath, {encoding: 'utf-8'}, function(err, data) {
            if (!err) {
                var imports = data.toString().match(/define\(\[.*\]/);
                if (imports){
                    console.log('single line', entry.fullPath.split('src')[1]);
                    console.log(imports[0]);
                    var sanitizedImports = sanitizeImports(imports[0]);
                    addToReport({
                        file: entry.fullPath.split('src')[1],
                        importArray: sanitizedImports
                    });
                }
                else {
                    imports = data.toString().match(/define\(\[[\s\S]*\n\],/);
                    if (imports){
                        console.log('multiple lines with only bracket in last line', entry.fullPath.split('src')[1]);
                        console.log(imports[0]);
                        var sanitizedImports = sanitizeImports(imports[0]);
                        addToReport({
                            file: entry.fullPath.split('src')[1],
                            importArray: sanitizedImports
                        });

                    }else {
                        imports = data.toString().match(/define\(\[[\s\S]*\'],/);
                        if (imports){
                            console.log('multiple lines end same line as bracket, and single quote', entry.fullPath.split('src')[1]);
                            console.log(imports[0]);
                            var sanitizedImports = sanitizeImports(imports[0]);
                            addToReport({
                                file: entry.fullPath.split('src')[1],
                                importArray: sanitizedImports
                            });

                        }
                        else {
                            imports = data.toString().match(/define\(\[[\s\S]*[\s].*('|")\],/);
                            if (imports){
                                console.log('multiple lines end same line as bracket', entry.fullPath.split('src')[1]);
                                console.log(imports[0]);
                                var sanitizedImports = sanitizeImports(imports[0]);
                                addToReport({
                                    file: entry.fullPath.split('src')[1],
                                    importArray: sanitizedImports
                                });
                            }
                            else {
                                imports = data.toString().match(/define\(\[[\s\S]*[\s]\],/);
                                if (imports){
                                    console.log('multiple lines', entry.fullPath.split('src')[1]);
                                    console.log(imports[0]);
                                    var sanitizedImports = sanitizeImports(imports[0]);
                                    addToReport({
                                        file: entry.fullPath.split('src')[1],
                                        importArray: sanitizedImports
                                    });
                                }
                                else {
                                    imports = data.toString().match(/define\([\s\S]*[\s].*('|")\],/);
                                    if (imports){
                                        console.log('multiple lines end same line as bracket, define alone', entry.fullPath.split('src')[1]);
                                        console.log(imports[0]);
                                        var sanitizedImports = sanitizeImports(imports[0]);
                                        addToReport({
                                            file: entry.fullPath.split('src')[1],
                                            importArray: sanitizedImports
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                console.log(err);
            }
        });
    })
    // Optionally call stream.destroy() in `warn()` in order to abort and cause 'close' to be emitted
    .on('warn', error => console.error('non-fatal error', error))
    .on('error', error => console.error('fatal error', error))
    .on('end', () => {
        console.log("done");
    });


function sanitizeImports(defineBlock) {
    var arrayOfImports = defineBlock.split(',');
    arrayOfImports = removeQuotesAndBracketAndWhiteSpace(arrayOfImports);
    arrayOfImports = removeOjetImportsAndEmptyString(arrayOfImports);
    // arrayOfImports = removeQuotesAndWhiteSpace(arrayOfImports);
    console.log("trimmed imports: ", arrayOfImports);
    return arrayOfImports;
}

function removeQuotesAndBracketAndWhiteSpace(arrayOfImports){
    arrayOfImports.forEach(function(importString, index){
        this[index] =  importString.replace(/(\r\n|\n|\r|[\s*'"\]])/gm, "");
    }, arrayOfImports);
    return arrayOfImports;
}

function removeOjetImportsAndEmptyString(arrayOfImports){
    arrayOfImports = arrayOfImports.filter(function(importString){
        return !(importString.includes('ojs/') ||
                importString.includes('knockout') ||
                importString.includes('jquery') ||
				importString.includes('ojL10n!') ||
				importString.includes('text!') ||
                importString === '' ||
                importString === 'promise');
    });
    return arrayOfImports;
}




function addToReport(dataObject){
    var report = fs.readFileSync(__dirname + '/report.csv', 'utf-8');

    report += `${dataObject.file},${dataObject.importArray[0]}\n`;
    for (let i = 1; i< dataObject.importArray.length; i++){
        report += ` ,${dataObject.importArray[i]}\n`;
    }

    fs.writeFileSync(__dirname + '/report.csv', report, 'utf-8');
	
	//cleanup work - replace all 'undefined' with '(no imports)'
	report = fs.readFileSync(__dirname + '/report.csv', 'utf-8');
	report = report.replace(/undefined/, "(no imports)");
	
	//cleanup work - replace 'define([' with '(no imports)'
	report = report.replace(/define\(\[\n/, "(no imports)\n");
	
	//cleanup work - replace 'define([xyz' with 'xyz'
	report = report.replace(/define\(\[/, "");
	
	fs.writeFileSync(__dirname + '/report.csv', report, 'utf-8');
}

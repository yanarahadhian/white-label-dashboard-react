export function readCSV(fileUpload) {
    let response = {}
    let result = []
    let delimiter = ''
    let validationFieldIndex = []

    let splittedDataUpload = fileUpload.split('\n')
    
    let data = splittedDataUpload.slice(1)
    
    // get csv delimiter (semicolon : comma)
    for (let i = 0; i < splittedDataUpload[0].length; i++) {
        if (splittedDataUpload[0][i] === ',' || splittedDataUpload[0][i] === ';') {
            delimiter = splittedDataUpload[0][i]
            break
        }
    }
    
    let tableAttributes = splittedDataUpload[0].split(delimiter)
    
    // get the index of number, noktp, npwp, nomor_rekening

    tableAttributes.forEach(attribute => {
        if (attribute === 'username' || attribute === 'noktp' || attribute === 'npwp' || attribute === 'rekening_bank') {
            validationFieldIndex.push(tableAttributes.indexOf(attribute))
        }
    })

    // get the data after header/ attributes line
    data.forEach(datum => {
        let splittedDatum = datum.split(delimiter)
        
        if (splittedDatum.length > 1) {
            // number validation of usernames, noktp, npwp, rekening_bank

            for (let i = 0; i < validationFieldIndex.length; i++) {
                let validationResult = regexTest(splittedDatum[validationFieldIndex[i]])
                
                if (validationResult === false) {
                    response.error = true
                    return response
                }
            }

            result.push(splittedDatum)
        }
    })

    // set the attributes
    response.tableAttributes = tableAttributes
    response.data = result

    return response
}

function regexTest(params) {
    let regexPattern = /^\d+$/

    return regexPattern.test(params)
}
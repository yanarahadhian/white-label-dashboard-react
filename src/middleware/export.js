import moment from 'moment'
import fileDownload from 'js-file-download'

export function downloadCSV(data, title) {
    
    if (!data || data.length === 0) {
        return null
    }

    const timestamp = moment().format('DDMMYY-hmmss')
    const filename = `${ title }-${ timestamp }.csv`
    const columnDelimiter = ','
    const lineDelimiter = '\n'
    const keys = Object.keys(data[0])
    
    let result = keys.join(columnDelimiter)

    result += lineDelimiter

    data.forEach((item) => {
        let ctr = 0

        keys.forEach((key) => {
            if (ctr > 0) result += columnDelimiter

            let itemValue = item[key]

            if (itemValue && itemValue !== null && (typeof itemValue === 'string')) {
                itemValue = itemValue.replace(/,/g, ' ')
            }

            result += itemValue
            ctr += 1
        })

        result += lineDelimiter
    })

    fileDownload(result, filename)
}
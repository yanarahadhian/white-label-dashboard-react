import moment from 'moment'

// function to read filter in object literals and return into generated url. This will shorten much code line in the program.
export function readFilterData(filterObj) {
    let rowQuery = Object.keys(filterObj)
    let fitlerUrl = ''
      
      for (let field in rowQuery) {
        let rowParam = ''

        if (Object.values(filterObj)[field].type === 'DateFilter') {
          let date = {
            date : rowParam,
            comparator : Object.values(filterObj)[field].value.comparator }

          // validate value with ISO String date type, returns value if valid and call toISOString props in vice versa
          const dateFormatValid = moment(Object.values(filterObj)[field].value.date, 'YYYY-MM-DDTHH:mm:ss.sssZ', true)

          if (dateFormatValid) {
            rowParam = Object.values(filterObj)[field].value.date
          } else {
            rowParam = Object.values(filterObj)[field].value.date.toISOString()
          }

          date.date = rowParam

          fitlerUrl = fitlerUrl + '&' + rowQuery[field] + '=' + JSON.stringify(date)
        } else {
          rowParam = Object.values(filterObj)[field].value
          fitlerUrl = fitlerUrl + '&' + rowQuery[field] + '=' + rowParam
        }
      }

      return fitlerUrl
}
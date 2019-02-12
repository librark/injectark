import Jasmine from '../node_modules/jasmine/lib/jasmine'

const jasmine = new Jasmine()
jasmine.loadConfigFile('xjasmine.json')
jasmine.execute()

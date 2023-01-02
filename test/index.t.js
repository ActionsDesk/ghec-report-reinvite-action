jest.mock('@actions/github')
jest.mock('../src/reinvite')

const core = require('@actions/core')
const {context} = require('@actions/github')
const action = require('../src/index')
const Reinvite = require('../src/reinvite')

describe('index.js', () => {
  const createMock = jest.fn().mockReturnValue({})

  beforeEach(() => {
    Reinvite.mockImplementation(() => {
      return {create: createMock}
    })
  })

  afterEach(() => {
    Reinvite.mockClear()
    createMock.mockClear()
  })

  test('runs', async () => {
    expect.assertions(3)

    process.env.INPUT_REPORT_PATH = 'fixtures/report.csv'
    process.env.INPUT_TOKEN = 'token'
    process.env.INPUT_BASE_SHA = 'base'
    process.env.INPUT_HEAD_SHA = 'head'
    process.env.GITHUB_WORKSPACE = 'workspace'

    context.repo = {
      owner: 'owner',
      repo: 'repo',
    }

    const reinvite = new Reinvite()
    const getInputSpy = jest.spyOn(core, 'getInput')
    const createSpy = jest.spyOn(reinvite, 'create')
    const setFailedSpy = jest.spyOn(core, 'setFailed')

    await action.run()

    expect(getInputSpy).toHaveBeenCalledTimes(4)
    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(setFailedSpy).toHaveBeenCalledTimes(0)
  })

  test('throws for invalid report path', async () => {
    expect.assertions(1)

    process.env.INPUT_REPORT_PATH = '../report.csv'
    process.env.INPUT_TOKEN = 'token'
    process.env.GITHUB_WORKSPACE = 'workspace'

    context.repo = {
      owner: 'owner',
      repo: 'repo',
    }

    const setFailedSpy = jest.spyOn(core, 'setFailed').mockReturnValue('')

    await action.run()

    expect(setFailedSpy).toHaveBeenCalledTimes(1)
  })
})

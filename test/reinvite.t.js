jest.mock('@actions/github')

const fs = require('fs')

const github = require('@actions/github')
const Reivite = require('../src/reinvite')

github.getOctokit = jest.fn().mockImplementation(() => {
  const buffer = fs.readFileSync(`${__dirname}/fixture/report.diff`, 'utf8')
  const patch = buffer.toString('ascii', 0, buffer.length)

  return {
    rest: {
      orgs: {
        createInvitation: jest.fn().mockReturnValue({}),
      },
      repos: {
        compareCommits: jest.fn().mockReturnValue({
          data: {
            files: [
              {
                filename: 'report.csv',
                patch,
              },
            ],
          },
        }),
      },
      users: {
        getByUsername: jest.fn().mockReturnValue({data: {id: 1}}),
      },
    },
  }
})

describe('reinvite.js', () => {
  let octokit
  let options

  beforeEach(() => {
    octokit = new github.getOctokit('token')

    options = {
      path: 'report.csv',
      base: 'base',
      head: 'head',
      owner: 'owner',
      repo: 'repo',
    }
  })

  afterEach(() => {})

  test('is a class', async () => {
    expect.assertions(1)

    expect(new Reivite(octokit, options)).toBeInstanceOf(Reivite)
  })

  test('has methods', async () => {
    expect.assertions(3)

    const reinvite = new Reivite(octokit, options)

    expect(reinvite.create).toBeInstanceOf(Function)
    expect(reinvite.diffReport).toBeInstanceOf(Function)
    expect(reinvite.sendInvite).toBeInstanceOf(Function)
  })

  test('requires parameters', async () => {
    expect.assertions(7)

    let reinvite

    expect(() => {
      reinvite = new Reivite(octokit, options)
    }).not.toThrow()

    expect(reinvite.octokit).toBeInstanceOf(Object)
    expect(reinvite.path).toBe('report.csv')
    expect(reinvite.base).toBe('base')
    expect(reinvite.head).toBe('head')
    expect(reinvite.owner).toBe('owner')
    expect(reinvite.repo).toBe('repo')
  })

  test('diffs a report', async () => {
    expect.assertions(1)

    const reinvite = new Reivite(octokit, options)

    const diffReportSpy = jest.spyOn(reinvite, 'diffReport')

    await reinvite.create()

    expect(diffReportSpy).toHaveBeenCalledTimes(1)
  })

  test('finds users by login to reinvite', async () => {
    expect.assertions(3)

    const reinvite = new Reivite(octokit, options)

    const {reinvites} = await reinvite.create()

    expect(reinvites.length).toBe(1)
    expect(reinvites[0].login).toBe('mona')
    expect(reinvites[0].email).toBe('')
  })

  test('finds users by email to reinvite', async () => {
    expect.assertions(3)

    const reinvite = new Reivite(octokit, options)

    const {failed} = await reinvite.create()

    expect(failed.length).toBe(1)
    expect(failed[0].login).toBe('')
    expect(failed[0].email).toBe('octodog@example.com')
  })

  test('reinvites from report', async () => {
    expect.assertions(5)

    const reinvite = new Reivite(octokit, options)

    const sendInviteSpy = jest.spyOn(reinvite, 'sendInvite')
    const getByUsernameSpy = jest.spyOn(octokit.rest.users, 'getByUsername')
    const createInvitationSpy = jest.spyOn(octokit.rest.orgs, 'createInvitation')

    const {reinvites, failed} = await reinvite.create()

    expect(sendInviteSpy).toHaveBeenNthCalledWith(1, reinvites)
    expect(sendInviteSpy).toHaveBeenNthCalledWith(2, failed)

    expect(getByUsernameSpy).toHaveBeenCalledTimes(1)

    expect(createInvitationSpy).toHaveBeenNthCalledWith(1, {
      email: 'octodog@example.com',
      org: 'demo',
    })
    expect(createInvitationSpy).toHaveBeenNthCalledWith(2, {
      invitee_id: 1,
      org: 'demo',
    })
  })

  test('does not invite for wrong report file', async () => {
    options.path = 'wrong.file'

    const reinvite = new Reivite(octokit, options)

    const {reinvites, failed} = await reinvite.create()

    expect(reinvites.length).toBe(0)
    expect(failed.length).toBe(0)
  })
})

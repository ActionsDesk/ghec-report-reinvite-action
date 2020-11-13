/**
 * Reinvitation Action.
 */
const path = require('path')

const core = require('@actions/core')
const github = require('@actions/github')

;(async () => {
  const isDebug = core.isDebug()

  try {
    const reportPath = core.getInput('report-path', {required: true})

    const filePath = path.join(process.env.GITHUB_WORKSPACE, reportPath)
    const {dir} = path.parse(filePath)

    if (dir.indexOf(process.env.GITHUB_WORKSPACE) < 0) {
      throw new Error(`${reportPath} is not an allowed path`)
    }

    const token = core.getInput('token', {required: true})
    const octokit = new github.getOctokit(token)

    const base = core.getInput('base-sha', {required: true})
    const head = core.getInput('head-sha', {required: true})

    const {owner, repo} = github.context.repo

    // get the `git diff`
    const {
      data: {files}
    } = await octokit.request('GET /repos/{owner}/{repo}/compare/{base}...{head}', {
      owner,
      repo,
      base,
      head
    })

    const records = []
    for (const file of files) {
      if (file.filename === reportPath) {
        const lines = file.patch.split('\n')

        // extract those that have been removed since last report,
        // they are the ones who have
        //    a) accepted their invite already
        //    b) their invite expired
        //    c) their invite was canceled
        for (const l of lines) {
          if (l.indexOf('---') === -1 && l.indexOf('-') === 0) {
            const [org, login, email] = l.slice(1).split(',')

            records.push({org, login, email})
          }
        }
      }
    }

    // if we do not have any invitees, stop here
    if (records.length <= 0) {
      core.info(`no pending invitations found`)
      process.exit(0)
    }

    core.startGroup('sending organization invitations...')
    for (const {org, login: username, email} of records) {
      const opts = {org}

      if (username === undefined) {
        opts.email = email
      } else {
        // get the user id for the username to use for the invitations call
        const {
          data: {id: invitee_id}
        } = await octokit.request('GET /users/{username}', {username})

        opts.invitee_id = invitee_id
      }

      try {
        const {status, data} = await octokit.request('POST /orgs/{org}/invitations', opts)

        if (status === 201) {
          if (isDebug) {
            core.debug(`organization(${org}) invitation sent to ${data.login ? data.login : data.email}`)
          } else {
            core.info(`organization(${org}) invitation sent`)
          }
        }
      } catch (err) {
        if (isDebug) {
          core.debug(`organization(${org}) invitation skipped; ${username} is already a member`)
        } else {
          core.info(`organization(${org}) invitation skipped`)
        }
      }
    }
    core.endGroup()
  } catch (err) {
    core.setFailed(err.message)
  }
})()

import { Command, flags } from '@oclif/command'
import * as fs from 'fs'
import { promises as fsPromises } from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'

interface UriLocation {
  uri: string
}

export default class Create extends Command {
  static description = 'Downloads and installs the latest Jbrowse 2 release'

  static examples = [
    '$ jbrowse create /path/to/new/installation',
    '$ jbrowse create /path/to/new/installation -force',
  ]

  static args = [
    {
      name: 'userPath',
      required: true,
      description: `Location where jbrowse 2 will be installed`,
    },
  ]

  static flags = {
    help: flags.help({ char: 'h' }),
    force: flags.boolean({
      char: 'f',
      description:
        'Overwrites existing jbrowse installation if present in path',
    }),
  }

  async run() {
    const { args: runArgs, flags: runFlags } = this.parse(Create)
    const { userPath: argsPath } = runArgs as { userPath: string }
    this.debug(`Want to install path at: ${argsPath}`)

    const { force } = runFlags
    if (!force) await this.checkPath(JSON.stringify(argsPath))

    // download the zipped file to path given
    const fileStream = fs.createWriteStream(argsPath)
    await fetch('https://sampleurl.aws.com', {
      method: 'GET',
    })
      .then(res => res.body)
      .then(body => {
        body.pipe(fileStream)
        fileStream.on('error', err => {
          fs.unlink(argsPath, () => {})
          this.error(
            `Failed to download JBrowse 2 with error: ${err}. Please try again later`,
          )
        })
        fileStream.on('finish', () => fileStream.close())
      })
      .catch(err =>
        this.error(
          `Failed to download JBrowse 2 with error: ${err}. Please try again later`,
        ),
      )

    // read the zipfile in the path
    fsPromises
      .readFile(path.join('placeholderJBrowseName.zip', argsPath))
      .then(/* unzip in the path provided */)
    // get path from args, force from flags
    // if(!pathIsEmpty)
    //  if(!noForceFlag) write error message saying there is existing files, and return
    // else if force flag or path is empty, run rest of code
    // download from s3 bucket the zipped jbrowse 2

    // if(forceFlag && !pathIsEmpty) will need to overwrite any files that conflict
    // with new isntallation
  }

  async checkPath(userPath: string) {
    const pathExists = await fs.existsSync(userPath)
    if (pathExists) {
      fsPromises.readdir(userPath).then(files => {
        return files.length === 0
          ? true
          : this.error(
              `This directory has existing files and could cause conflicts with create. 
              Please choose another directory or use the force flag to overwrite existing files`,
            )
      })
    }
    return pathExists
  }
}

/**
 * Copyright(c) 2016 calidion <calidion@gmail.com>
 * Apache 2.0 Licensed
 */

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

/**
 * Base class for all Components
 */

export class VBase {
  // default path where components can read definitions from
  protected defaultPath = ''
  // Component base directory
  protected basePath = __dirname
  // stored data from specified directory.
  protected data: any = {};

  // files loaded
  protected files: Array<string> = [];

  // data types:
  // named. named by filename
  // nameless. merged by object
  protected nameless = false;

  protected filterEnabled = false;

  protected filters: Array<String> = [];

  constructor(path: string) {
    this.basePath = path;
  }

  get() {
    return this.data;
  }

  getFiles() {
    return this.files;
  }

  reset() {
    this.data = {};
    this.files = [];
  }

  addFile(file: string = '') {
    if (fs.existsSync(file)) {
      this.files.push(file);
    }
  }

  getFile(file: string): Object {
    if (fs.existsSync(file)) {
      var json = require(file);
      return json;
    }
    return null;
  }

  extends(name: string, json: Object, data: any = {}) {
    if (this.nameless) {
      data = _.merge(this.data, json);
    } else {
      data[name] = json;
    }
    return data;
  }

  generate(data = {}) {
    this.files.forEach(file => {
      const json = require(file);
      const name = path.basename(file, path.extname(file))
      data = this.extends(name, json, data);
    });
    return data;
  }

  filter() {
    if (!this.filterEnabled) {
      console.warn('Filter is not enabled!');
      return;
    }
    this.files = this.files.map(file => {
      return this._filter(file);
    });
  }

  protected _filter(file: string) {
    const name = path.basename(file, path.extname(file))
    if (this.filters.indexOf(name) !== -1) {
      return file
    }
    console.warn('File filtered :' + file);
    return null;
  }

  load(dir = '', data = {}) {
    const allowedExtensions = ['.js', '.ts', '.json'];
    if (!dir) {
      console.log(this.basePath, this.defaultPath);
      dir = path.resolve(this.basePath, this.defaultPath);
      console.log(dir);
    }
    if (!fs.existsSync(dir)) {
      console.error('Directory:[' + dir + '] not exists!');
      return null;
    }

    let files = fs.readdirSync(dir);
    files.forEach((file) => {
      let absPath = path.resolve(dir, file);
      let stat = fs.statSync(absPath);
      // ignore directories
      if (stat && stat.isDirectory()) {
        console.log('Directory:' + absPath + ' is ignored!');
        return;
      }
      // read from only valid extensions
      if (allowedExtensions.indexOf(path.extname(file)) === -1) {
        console.log('File:' + absPath + ' is ignored!');
        return;
      }
      if (this.filterEnabled && !this._filter(absPath)) {
        return;
      }
      this.files.push(absPath);
      const json = require(absPath);
      const name = path.basename(absPath, path.extname(absPath))
      data = this.extends(name, json, data);
    });
    return data;
  }
};

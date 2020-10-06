export class AuthLoginInfo {
    username: string;
    password: string;

    constructor(username: string, password: string) {
      console.log("inAuthLoginInfo username= "+this.username);
      console.log("inAuthLoginInfo password= "+this.password);
      console.log("AuthLoginInfo username= "+username);
      console.log("AuthLoginInfo password= "+password);

        this.username = username;
        this.password = password;
    }
}

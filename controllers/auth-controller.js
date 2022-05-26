const UserDto = require("../dtos/user-dto");
const hashService = require("../services/hash-service");
const mailSender = require("../services/mailSender");
const otpService = require("../services/otp-service");
const tokenService = require("../services/token-service");
const userService = require("../services/user-service");

class AuthController {

    async sendOtp(req, res) {
        const { phone, code } = req.body;
        if(!phone || !code) {
            res.status(400).json({ message: 'Phone field is required !'});
        }

        // Generate Otp
        const otp = await otpService.generateOtp();

        // Hash Otp
        const ttl = 1000 * 60 * 2;                  // 2 minutes
        const expires = Date.now() + ttl;           // Expiry time

        const data = `${phone}.${otp}.${expires}`;
        const hash = hashService.hashOtp(data);

        // Send otp
        try {
            // await otpService.sendBySms(phone, code, otp);
            res.json({
                hash: `${hash}.${expires}`,
                phone,
                otp,
            })
        } catch(err) {
            console.log(err);
            res.status(500).json({ message: 'Otp Sending failed'});
        }

    }


    async sendOtpEmail(req, res) {
        const { email } = req.body;
        if(!email) {
            res.status(400).json({ message: 'Phone field is required !'});
        }

        // Generate Otp
        const otp = await otpService.generateOtp();

        // Hash Otp
        const ttl = 1000 * 60 * 2;                  // 2 minutes
        const expires = Date.now() + ttl;           // Expiry time

        const data = `${email}.${otp}.${expires}`;
        const hash = hashService.hashOtp(data);

        // Send otp
        try {
            // let markupCustomer = `
            //         <div style="height: 50px; width: 100%; background: #59b256">
            //             <h1 style="color: #fff; text-align: center; padding-top: 20px;">Verification Code</h1>
            //         </div>
            //         <h1>Your Verification code is <br /> </h1>
            //         <p>${otp}</p>
            //         <p>Please do not disclose this OTP with anyone.</p>
            //     `;
            // const subjectCustomer = 'Social Hub - OTP Verification';
            // const toEmailCustomer = email;
            // mailSender(toEmailCustomer, markupCustomer, subjectCustomer);
            res.json({
                hash: `${hash}.${expires}`,
                email,
                otp,
            })
        } catch(err) {
            console.log(err);
            res.status(500).json({ message: 'Otp Sending failed'});
        }

    }


    async verifyOtp(req, res) {
        const { phone, otp, hash } = req.body;

        if(!phone || !otp || !hash) {
            res.status(400).json({ message: "All fields are required"});
        }

        const [ hashedOtp, expires ] = hash.split('.');

            if(Date.now() > +expires) {
                res.status(400).json({ message: 'Otp expired !'});
            }
    
            const data = `${phone}.${otp}.${expires}`;
    
            const isValid = otpService.verifyOtp(hashedOtp, data);
    
            if(!isValid) {
                res.status(400).json({ message: 'Invalid Otp' });
            }
    
            let user;
    
            try {
                user = await userService.findUser({ phone });
                if(!user) {
                    user = await userService.createUser({ phone });
                }
            } catch(err) {
                console.log(err);
                res.status(500).json({ message: 'Something went wrong...'});
            }
    
            const { accessToken, refreshToken } = tokenService.generateTokens({ 
                _id: user._id,
                activated: false,
            });
    
            await tokenService.storeRefreshToken(refreshToken, user._id);
    
            res.cookie('refreshToken', refreshToken, {
                maxAge: 1000 * 60 * 60 * 24 * 30,
                httpOnly: true
            });
            res.cookie('accessToken', accessToken, {
                maxAge: 1000 * 60 * 60 * 24 * 30,
                httpOnly: true
            });
    
            const userDto = new UserDto(user);
            res.json({ user: userDto, auth: true });

    }



    async verifyOtpEmail(req, res) {
        const { email, otp, hash } = req.body;

        if(!email || !otp || !hash) {
            res.status(400).json({ message: "All fields are required"});
        }

        const [ hashedOtp, expires ] = hash.split('.');

            if(Date.now() > +expires) {
                res.status(400).json({ message: 'Otp expired !'});
            }
    
            const data = `${email}.${otp}.${expires}`;
    
            const isValid = otpService.verifyOtp(hashedOtp, data);
    
            if(!isValid) {
                res.status(400).json({ message: 'Invalid Otp' });
            }
    
            let user;
    
            try {
                user = await userService.findUser({ email });
                if(!user) {
                    user = await userService.createUser({ email });
                }
            } catch(err) {
                console.log(err);
                res.status(500).json({ message: 'Something went wrong...'});
            }
    
            const { accessToken, refreshToken } = tokenService.generateTokens({ 
                _id: user._id,
                activated: false,
            });
    
            await tokenService.storeRefreshToken(refreshToken, user._id);
    
            res.cookie('refreshToken', refreshToken, {
                maxAge: 1000 * 60 * 60 * 24 * 30,
                httpOnly: true
            });
            res.cookie('accessToken', accessToken, {
                maxAge: 1000 * 60 * 60 * 24 * 30,
                httpOnly: true
            });
    
            const userDto = new UserDto(user);
            res.json({ user: userDto, auth: true });

    }



    async refresh(req, res) {
        const { refreshToken: refreshTokenFromCookie } = req.cookies;

        let userData;
        try {
            userData = await tokenService.verifyRefreshToken(refreshTokenFromCookie);
        } catch(err) {
            return res.status(401).json({ message: 'Invalid token'});
        }
    
        try {
            const token = await tokenService.findRefreshToken(userData._id, refreshTokenFromCookie);
            if(!token) {
                return res.status(401).json({ message: 'Invalid token'});
            }
        } catch(err) {
            return res.status(500).json({ message: 'Invalid token'});
        }

        const user = await userService.findUser({ _id: userData._id });
        if(!user) {
            return res.status(404).json({ message: 'No user'});
        }


        const { accessToken, refreshToken } = tokenService.generateTokens({ _id: userData._id });

        try {
            await tokenService.updateRefreshToken(userData._id, refreshToken);
        } catch(err) {
            return res.status(404).json({ message: 'Internal Server error'});
        }

        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true
        });
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true
        });

        const userDto = new UserDto(user);
        res.json({ user: userDto, auth: true });
        
    }

    async logout(req, res) {
        // delete refresh token from db

        const { refreshToken } = req.cookies;
        await tokenService.removeToken(refreshToken);

        // delete cookie from res
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');

        res.json({ user: null, auth: false });
    }
}


module.exports = new AuthController();
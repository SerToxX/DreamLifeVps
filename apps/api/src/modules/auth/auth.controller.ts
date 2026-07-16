import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterClienteDto } from './dto/register-cliente.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login/admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login para admin y workers' })
  loginAdmin(@Body() dto: LoginDto) {
    return this.authService.loginUsuario(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login para clientes ecommerce' })
  loginCliente(@Body() dto: LoginDto) {
    return this.authService.loginCliente(dto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registro de nuevo cliente' })
  register(@Body() dto: RegisterClienteDto) {
    return this.authService.registerCliente(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener nuevo access token' })
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refreshToken(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body('refreshToken') token: string) {
    return this.authService.logout(token);
  }
}

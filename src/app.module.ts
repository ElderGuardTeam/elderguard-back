import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ElderlyModule } from './elderly/elderly.module';
import { ContactModule } from './contact/contact.module';
import { AddressModule } from './address/address.module';
import { UserModule } from './user/user.module';
import { ProfessionalModule } from './professional/professional.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { QuestionModule } from './question/question.module';
import { OptionModule } from './option/option.module';
import { RuleEngineService } from './common/rule-engine/rule-engine.service';
import { RuleModule } from './rule/rule.module';
import { SeccionModule } from './seccion/seccion.module';
import { FormModule } from './form/form.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { EvaluationAnswareModule } from './evaluation-answare/evaluation-answare.module';
import { FormAnswareModule } from './form-answare/form-answare.module';
import { RuleBuilderService } from './common/rule-builder/rule-builder.service';
import { ImageStorageService } from './image-storage/image-storage.service';
import { ImageUploadController } from './image-storage/image-upload.controller';

@Module({
  imports: [
    DatabaseModule,
    ElderlyModule,
    ContactModule,
    AddressModule,
    UserModule,
    ProfessionalModule,
    AuthModule,
    MailModule,
    QuestionModule,
    OptionModule,
    RuleModule,
    SeccionModule,
    FormModule,
    EvaluationModule,
    EvaluationAnswareModule,
    FormAnswareModule,
  ],
  controllers: [AppController, ImageUploadController],
  providers: [
    AppService,
    RuleEngineService,
    RuleBuilderService,
    ImageStorageService,
  ],
})
export class AppModule {}

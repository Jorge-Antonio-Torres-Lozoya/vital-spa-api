import { DataSourceOptions, DataSource } from 'typeorm';
import { DBOptions } from './db.datasourceoptions';

const dsOptions: DataSourceOptions = <DataSourceOptions>{};
Object.assign(dsOptions, DBOptions);

const _AppDataSource = new DataSource(dsOptions);

_AppDataSource
  .initialize()
  .then(() => {
    console.log('¡La fuente de datos ha sido inicializada!');
  })
  .catch((err) => {
    console.error('Error durante la inicialización de la fuente de datos', err);
  });

export const AppDataSource = _AppDataSource;
